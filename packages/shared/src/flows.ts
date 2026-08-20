/**
 * Flow graph contract — the shape stored in FlowVersion.graph and rendered
 * by the React Flow editor. The flow engine (API side) interprets the same
 * structure, so this file is the single source of truth for node semantics.
 */
import type { MessageContent } from './messaging';

export const FLOW_NODE_TYPES = [
  'trigger',
  'message',
  'condition',
  'delay',
  'ai_response',
  'http_request',
  'tag',
  'set_field',
  'sequence',
  'handover',
  'payment',
  'note',
] as const;

export type FlowNodeType = (typeof FLOW_NODE_TYPES)[number];

/** Condition tree shared by Condition nodes and Segments */
export interface RuleCondition {
  /** "tag" | "field:<key>" | "lastSeenAt" | "channel" | "message.text" … */
  field: string;
  op: 'eq' | 'neq' | 'has' | 'not_has' | 'contains' | 'gt' | 'lt' | 'exists' | 'not_exists';
  value?: unknown;
}

export interface RuleGroup {
  all?: Array<RuleCondition | RuleGroup>;
  any?: Array<RuleCondition | RuleGroup>;
}

// --- Per-node data payloads --------------------------------------------------

export interface TriggerNodeData {
  triggerType:
    | 'KEYWORD'
    | 'COMMENT'
    | 'STORY_REPLY'
    | 'STORY_MENTION'
    | 'REFERRAL'
    | 'OPT_IN'
    | 'NEW_CONVERSATION'
    | 'WEBHOOK'
    | 'MANUAL'
    | 'SCHEDULE';
  config: Record<string, unknown>;
}

export interface MessageNodeData {
  content: MessageContent;
  /** Pause the flow until the contact replies; reply stored in `variables[saveAs]` */
  waitForReply?: boolean;
  saveAs?: string;
}

export interface ConditionNodeData {
  rules: RuleGroup;
}

export interface DelayNodeData {
  /** Either a fixed duration… */
  seconds?: number;
  /** …or "wait until" a time of day in the contact's timezone, e.g. "09:00" */
  until?: string;
}

export interface AiResponseNodeData {
  aiAgentId: string;
  /** If true the agent takes over the conversation until handover rules fire */
  takeOver?: boolean;
  /** Extra instructions appended to the agent's system prompt for this node */
  instructions?: string;
}

export interface HttpRequestNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  /** Response JSON paths mapped into flow variables: { "price": "$.data.price" } */
  saveAs?: Record<string, string>;
}

export interface TagNodeData {
  action: 'add' | 'remove';
  tagName: string;
}

export interface SetFieldNodeData {
  key: string;
  value: string;
}

export interface SequenceNodeData {
  action: 'enroll' | 'unenroll';
  sequenceId: string;
}

export interface HandoverNodeData {
  /** Assign to a specific agent or leave unassigned in the team inbox */
  assignToUserId?: string;
  notifyMessage?: string;
}

export interface PaymentNodeData {
  provider: 'stripe';
  amountCents: number;
  currency: string;
  description: string;
}

export interface NoteNodeData {
  text: string;
}

export type FlowNodeData =
  | TriggerNodeData
  | MessageNodeData
  | ConditionNodeData
  | DelayNodeData
  | AiResponseNodeData
  | HttpRequestNodeData
  | TagNodeData
  | SetFieldNodeData
  | SequenceNodeData
  | HandoverNodeData
  | PaymentNodeData
  | NoteNodeData;

// --- Graph -------------------------------------------------------------------

export interface FlowNode<T extends FlowNodeData = FlowNodeData> {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: T;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  /** Branch handle: "true"/"false" on conditions, button payloads on messages */
  sourceHandle?: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
