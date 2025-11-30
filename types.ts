export enum AvatarStatus {
  IDLE = 'idle',
  LISTENING = 'listening',
  SPEAKING = 'speaking',
  THINKING = 'thinking'
}

export enum Sender {
  USER = 'user',
  MODEL = 'model'
}

export type GroundingSource = {
  web?: {
    uri: string;
    title: string;
  };
};

export type MessagePart = {
  text?: string;
  imageUrl?: string;
  fileData?: { mimeType: string; fileUri: string };
  sources?: GroundingSource[];
}

export type Message = {
  sender: Sender;
  parts: MessagePart[];
  timestamp: number;
};