export type User = {
  id: string;
  name: string;
};

export type Transcript = {
  id: string;
  text: string;
  audio: string;
  sequence: string;
};

export type Transcripts = {
  id: string;
  topic: string;
  scenario: string;
  items: Transcript[];
};

export type Result = {
  target: any;
  feedback: {
    text: string;
    audio: string;
  };
  pronunciation: {
    text: any;
    alignments: {
      token: string;
      score: number;
      interval: [number, number];
    }[];
    phonemes: string[];
  };
};
