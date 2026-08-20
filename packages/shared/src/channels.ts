/**
 * Channel capability matrix — what each platform supports.
 * Used by the flow editor to warn when a node isn't supported on a channel,
 * and by adapters to gracefully degrade (e.g. carousel -> image + links).
 */

export const CHANNEL_TYPES = [
  'INSTAGRAM',
  'MESSENGER',
  'WHATSAPP',
  'TELEGRAM',
  'WEBCHAT',
  'EMAIL',
  'SMS',
] as const;

export type ChannelTypeName = (typeof CHANNEL_TYPES)[number];

export interface ChannelCapabilities {
  buttons: boolean;
  quickReplies: boolean;
  carousels: boolean;
  media: boolean;
  typingIndicator: boolean;
  readReceipts: boolean;
  /** Messaging window in hours (Meta: 24h policy); null = unrestricted */
  messagingWindowHours: number | null;
}

export const CHANNEL_CAPABILITIES: Record<ChannelTypeName, ChannelCapabilities> = {
  INSTAGRAM: {
    buttons: true,
    quickReplies: true,
    carousels: true,
    media: true,
    typingIndicator: true,
    readReceipts: true,
    messagingWindowHours: 24,
  },
  MESSENGER: {
    buttons: true,
    quickReplies: true,
    carousels: true,
    media: true,
    typingIndicator: true,
    readReceipts: true,
    messagingWindowHours: 24,
  },
  WHATSAPP: {
    buttons: true,
    quickReplies: true,
    carousels: false,
    media: true,
    typingIndicator: false,
    readReceipts: true,
    messagingWindowHours: 24, // outside the window requires approved templates
  },
  TELEGRAM: {
    buttons: true,
    quickReplies: true,
    carousels: false,
    media: true,
    typingIndicator: true,
    readReceipts: false,
    messagingWindowHours: null,
  },
  WEBCHAT: {
    buttons: true,
    quickReplies: true,
    carousels: true,
    media: true,
    typingIndicator: true,
    readReceipts: true,
    messagingWindowHours: null,
  },
  EMAIL: {
    buttons: false,
    quickReplies: false,
    carousels: false,
    media: true,
    typingIndicator: false,
    readReceipts: false,
    messagingWindowHours: null,
  },
  SMS: {
    buttons: false,
    quickReplies: false,
    carousels: false,
    media: false,
    typingIndicator: false,
    readReceipts: false,
    messagingWindowHours: null,
  },
};
