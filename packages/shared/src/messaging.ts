/**
 * Normalized cross-channel message content.
 *
 * Every channel adapter (Instagram, Messenger, WhatsApp, Telegram, WebChat)
 * translates between this shape and its platform-specific payload. Flows and
 * the inbox only ever deal with this normalized form.
 */

export interface MessageButton {
  /** `url` opens a link, `postback` sends a payload back into the flow engine */
  type: 'url' | 'postback' | 'call';
  title: string;
  url?: string;
  payload?: string;
  phoneNumber?: string;
}

export interface QuickReply {
  title: string;
  payload: string;
  imageUrl?: string;
}

export interface CarouselCard {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons?: MessageButton[];
  defaultActionUrl?: string;
}

export interface MessageContent {
  /** Plain text, supports {{variable}} interpolation in flow context */
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  buttons?: MessageButton[];
  quickReplies?: QuickReply[];
  cards?: CarouselCard[];
  /** WhatsApp template reference: { name, language, components } */
  template?: Record<string, unknown>;
}
