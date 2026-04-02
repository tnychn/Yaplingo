from asyncio import Lock
from datetime import timedelta
from typing import ParamSpec, TypeVar

from taskiq import AsyncTaskiqDecoratedTask, AsyncTaskiqTask, TaskiqEvents, TaskiqState
from taskiq_redis import RedisAsyncResultBackend, RedisStreamBroker
from ulid import ULID

from server.logging_config import configure_runtime_logging
from server.core import ChatPipeline, EchoPipeline

from .settings import settings

P = ParamSpec("P")
T = TypeVar("T")

# Track in-progress tasks to avoid duplicate execution
_in_progress_tasks: dict[str, AsyncTaskiqTask] = {}
_task_lock = Lock()


class Broker:
    broker = (
        RedisStreamBroker(
            url=str(settings.url),
        )
        .with_result_backend(
            RedisAsyncResultBackend(
                redis_url=str(settings.url),
                keep_results=True,
                result_ex_time=timedelta(hours=1).seconds,
            )
        )
        .with_id_generator(lambda: str(ULID()))
    )

    @staticmethod
    @broker.on_event(TaskiqEvents.WORKER_STARTUP)
    async def startup(state: TaskiqState):
        configure_runtime_logging()
        state.echo = EchoPipeline()
        state.chat = ChatPipeline()

    @classmethod
    async def create(cls):
        if not cls.broker.is_worker_process:
            await cls.broker.startup()
        return cls()

    async def dispose(self):
        if not self.broker.is_worker_process:
            await self.broker.shutdown()

    async def _delegate(
        self,
        task_fn: AsyncTaskiqDecoratedTask[P, T],
        task_id: str | ULID | None = None,
        *args: P.args,
        **kwargs: P.kwargs,
    ) -> AsyncTaskiqTask[T]:
        kicker = task_fn.kicker().with_task_id(str(task_id))
        return await kicker.kiq(*args, **kwargs)

    async def delegate(
        self,
        task_fn: AsyncTaskiqDecoratedTask[P, T],
        task_id: str | ULID | None = None,
        *args: P.args,
        **kwargs: P.kwargs,
    ) -> None:
        await self._delegate(task_fn, task_id, *args, **kwargs)

    async def _recall(self, task: AsyncTaskiqTask[T]) -> T:
        result = await task.wait_result()
        if result.is_err and result.error is not None:
            raise result.error
        return result.return_value

    async def recall(
        self,
        task_fn: AsyncTaskiqDecoratedTask[P, T],
        task_id: str | ULID | None = None,
    ) -> T:
        task = AsyncTaskiqTask(
            task_id=str(task_id),
            result_backend=self.broker.result_backend,
            return_type=task_fn.return_type,  # type: ignore
        )
        return await self._recall(task)  # type: ignore

    async def execute(
        self,
        task_func: AsyncTaskiqDecoratedTask[P, T],
        task_id: str | ULID | None = None,
        *args: P.args,
        **kwargs: P.kwargs,
    ) -> T:
        task_id_str = str(task_id) if task_id is not None else None

        # Check if result is already ready
        if task_id_str is not None and await self.broker.result_backend.is_result_ready(task_id_str):
            task = AsyncTaskiqTask(
                task_id=task_id_str,
                result_backend=self.broker.result_backend,
                return_type=task_func.return_type,  # type: ignore
            )
            return await self._recall(task)  # type: ignore

        # Check if task is already in progress (avoid duplicate execution)
        async with _task_lock:
            if task_id_str is not None and task_id_str in _in_progress_tasks:
                task = _in_progress_tasks[task_id_str]
            else:
                task = await self._delegate(task_func, task_id, *args, **kwargs)
                if task_id_str is not None:
                    _in_progress_tasks[task_id_str] = task

        try:
            return await self._recall(task)  # type: ignore
        finally:
            # Clean up in-progress tracking
            if task_id_str is not None:
                async with _task_lock:
                    _in_progress_tasks.pop(task_id_str, None)


broker = Broker.broker

__all__ = ["broker", "Broker"]
