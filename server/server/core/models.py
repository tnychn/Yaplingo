import functools
import logging
import re

from isodate.version import TYPE_CHECKING
from phonemizer import phonemize
from phonemizer.punctuation import Punctuation
from phonemizer.separator import Separator
from pydantic import BaseModel, PrivateAttr, computed_field
from typing_extensions import Self

from server.core.textspeech import data_urlencode, gtts

from .levenshtein import OperationCode, levenshtein

if TYPE_CHECKING:
    cached_property = property
else:
    from functools import cached_property


SEPARATOR = Separator(phone="/", word=" ")
PUNCTUATION = Punctuation()

DIFFERENCE_CUTOFF = 0.75  # for filtering out differences with high enough confidence
logger = logging.getLogger(__name__)


def cached_method(f):
    attr = f"@{f.__name__}"

    @functools.wraps(f)
    def wrapper(self):
        if hasattr(self, attr):
            return object.__getattribute__(self, attr)
        object.__setattr__(self, attr, result := f(self))
        return result

    return wrapper


class Transcript(BaseModel):
    text: str

    @computed_field
    @cached_property
    def sequence(self) -> str:
        phonemes = phonemize(
            self.text,
            strip=True,
            with_stress=False,
            preserve_punctuation=True,
            words_mismatch="ignore",
            separator=SEPARATOR,
            language="en-us",
            backend="espeak",
        )
        return str(phonemes)

    @cached_property
    def phonemes(self) -> list[str]:
        sequence = Punctuation().remove(self.sequence)
        return re.split(r"[/ ]+", str(sequence).strip())

    @cached_method
    def get_word_boundaries(self) -> list[tuple[str, int, int]]:
        index = 0
        boundaries: list[tuple[str, int, int]] = []
        words = str(PUNCTUATION.remove(self.text)).split()
        phoneme_words = str(PUNCTUATION.remove(self.sequence)).split()

        for word_index, word in enumerate(words):
            start = index
            if word_index < len(phoneme_words):
                phones = [p for p in phoneme_words[word_index].split("/") if p]
                index += len(phones)
            boundaries.append((word, start, index))

        phoneme_count = len(self.phonemes)
        if boundaries:
            last_word, last_start, last_end = boundaries[-1]
            if last_end < phoneme_count:
                boundaries[-1] = (last_word, last_start, phoneme_count)
        elif phoneme_count > 0:
            boundaries.append(("utterance", 0, phoneme_count))

        return boundaries

    # cannot decorate with `cached_method` here because this method is async
    #   and would cause "RuntimeError: cannot reuse already awaited coroutine"
    async def get_audio(self) -> str:
        attr = "@audio"
        if hasattr(self, attr):
            audio = object.__getattribute__(self, attr)
        else:
            audio = data_urlencode(await gtts(self.text), gtts.MIME)
            object.__setattr__(self, attr, audio)
        return audio


class Transcripts(BaseModel):
    topic: str
    scenario: str
    items: list[Transcript]


class Pronunciation(BaseModel):
    _transcript: Transcript = PrivateAttr()

    class Alignment(BaseModel):
        token: str
        score: float
        interval: tuple[int, int]

    class Difference(BaseModel):
        word: str
        operation: OperationCode
        expected: str | None
        predicted: str | None

        def __str__(self) -> str:
            match self.operation:
                case "~":
                    operation = "replace"
                case "+":
                    operation = "insert"
                case "-":
                    operation = "delete"
            return "\t".join([f'"{self.word}"', operation, f"{self.expected or '∅'} → {self.predicted or '∅'}"])

    class WordSpan(BaseModel):
        phonemes: list[str]
        alignments: list["Pronunciation.Alignment"]
        differences: list["Pronunciation.Difference"]

    phonemes: list[str]
    alignments: list[Alignment]

    def with_transcript(self, transcript: Transcript) -> Self:
        self._transcript = transcript
        return self

    @staticmethod
    def _word_for_phoneme_index(boundaries: list[tuple[str, int, int]], index: int) -> str:
        if not boundaries:
            return "utterance"
        for word, start, end in boundaries:
            if start <= index < end:
                return word
        if index < boundaries[0][1]:
            return boundaries[0][0]
        return boundaries[-1][0]

    # FIXME: need fixing for edge cases
    @computed_field
    @cached_property
    def differences(self) -> list[Difference]:
        differences = []
        boundaries = self._transcript.get_word_boundaries()
        expected_phonemes = self._transcript.phonemes
        expected_len = len(expected_phonemes)
        if expected_len == 0:
            return differences

        _, _, operations = levenshtein(self._transcript.phonemes, self.phonemes)
        for opcode, i, j in operations:
            score_index = min(max(i, 0), len(self.alignments) - 1)
            if self.alignments and self.alignments[score_index].score >= DIFFERENCE_CUTOFF:
                continue  # skip phonemes with high enough confidence (consider them as correct)
            boundary_index = min(max(i, 0), expected_len - 1)
            word = self._word_for_phoneme_index(boundaries, boundary_index)

            expected = expected_phonemes[i] if opcode != "+" and 0 <= i < expected_len else None
            predicted = self.phonemes[j] if opcode != "-" and 0 <= j < len(self.phonemes) else None

            differences.append(
                Pronunciation.Difference(
                    word=word,
                    operation=opcode,
                    expected=expected,
                    predicted=predicted,
                )
            )

            if word == "utterance":
                logger.debug(
                    "Fallback boundary used for difference op=%s i=%s j=%s transcript='%s'",
                    opcode,
                    i,
                    j,
                    self._transcript.text,
                )
        return differences

    # FIXME: need fixing for edge cases
    @computed_field
    @cached_property
    def words(self) -> list[tuple[str, WordSpan]]:
        boundaries = self._transcript.get_word_boundaries()
        _, phonemes, _ = levenshtein(self._transcript.phonemes, self.phonemes)
        return [
            (
                word,
                Pronunciation.WordSpan(
                    phonemes=[p for p in phonemes[start:end] if p],
                    alignments=self.alignments[start:end],
                    differences=[d for d in self.differences if d.word == word],
                ),
            )
            for word, start, end in boundaries
        ]


class Result(BaseModel):
    feedback: str
    pronunciation: Pronunciation


__all__ = [
    "Transcript",
    "Transcripts",
    "Pronunciation",
    "Result",
]
