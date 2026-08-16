/**
 * Seed script: creates a demo workspace with a user, contacts, tags,
 * a webchat channel, a conversation, and a published "Comment-to-DM" demo flow.
 *
 * Run with: pnpm db:seed
 * Idempotent: uses upserts keyed on stable identifiers.
 */
import { createHash } from 'node:crypto';
import { PrismaClient, ChannelType, ChannelStatus, WorkspaceRole } from '../src/generated/client';

const prisma = new PrismaClient();

// NOTE: the real password hasher (argon2) lives in the API app (Phase 2).
// The seed uses a placeholder hash that the API will recognize and force-reset
// in production mode. Demo login (dev only): demo@flowfable.dev / demo1234
const DEMO_PASSWORD_HASH = `seed-sha256:${createHash('sha256').update('demo1234').digest('hex')}`;

async function main() {
  console.log('Seeding FlowFable demo data...');

  const user = await prisma.user.upsert({
    where: { email: 'demo@flowfable.dev' },
    update: {},
    create: {
      email: 'demo@flowfable.dev',
      name: 'Demo User',
      passwordHash: DEMO_PASSWORD_HASH,
      emailVerified: new Date(),
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo',
      settings: { timezone: 'UTC', locale: 'en' },
    },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    update: { role: WorkspaceRole.OWNER },
    create: { workspaceId: workspace.id, userId: user.id, role: WorkspaceRole.OWNER },
  });

  // --- Channel: a webchat widget works out of the box without external creds ---
  const channel = await prisma.channel.upsert({
    where: {
      workspaceId_type_externalId: {
        workspaceId: workspace.id,
        type: ChannelType.WEBCHAT,
        externalId: 'demo-widget',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      type: ChannelType.WEBCHAT,
      status: ChannelStatus.CONNECTED,
      name: 'Website Widget',
      externalId: 'demo-widget',
      config: { theme: { primaryColor: '#6366f1' }, welcomeMessage: 'Hi! How can we help?' },
    },
  });

  // --- Tags ---
  const tagNames: Array<[string, string]> = [
    ['lead', '#22c55e'],
    ['vip', '#f59e0b'],
    ['support', '#3b82f6'],
  ];
  const tags = await Promise.all(
    tagNames.map(([name, color]) =>
      prisma.tag.upsert({
        where: { workspaceId_name: { workspaceId: workspace.id, name } },
        update: {},
        create: { workspaceId: workspace.id, name, color },
      }),
    ),
  );

  // --- Custom field ---
  await prisma.customFieldDefinition.upsert({
    where: { workspaceId_key: { workspaceId: workspace.id, key: 'plan' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      key: 'plan',
      label: 'Subscription Plan',
      type: 'SELECT',
      options: ['free', 'pro', 'enterprise'],
    },
  });

  // --- Contacts + a demo conversation ---
  const contact = await prisma.contact.upsert({
    where: { id: 'seed-contact-jane' },
    update: {},
    create: {
      id: 'seed-contact-jane',
      workspaceId: workspace.id,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      customFields: { plan: 'pro' },
      lastSeenAt: new Date(),
      identities: {
        create: { channelId: channel.id, externalId: 'visitor-jane-001', handle: 'jane' },
      },
    },
  });

  await prisma.contactTag.upsert({
    where: { contactId_tagId: { contactId: contact.id, tagId: tags[0]!.id } },
    update: {},
    create: { contactId: contact.id, tagId: tags[0]!.id, source: 'manual' },
  });

  const conversation = await prisma.conversation.upsert({
    where: { id: 'seed-convo-jane' },
    update: {},
    create: {
      id: 'seed-convo-jane',
      workspaceId: workspace.id,
      channelId: channel.id,
      contactId: contact.id,
      lastMessagePreview: 'Do you have a pricing page?',
      messages: {
        create: [
          {
            direction: 'INBOUND',
            senderType: 'CONTACT',
            type: 'TEXT',
            status: 'RECEIVED',
            content: { text: 'Hi there! Do you have a pricing page?' },
          },
          {
            direction: 'OUTBOUND',
            senderType: 'BOT',
            type: 'TEXT',
            status: 'DELIVERED',
            content: { text: 'Hey Jane! Yes — check out flowfable.dev/pricing 🙌' },
          },
        ],
      },
    },
  });

  // --- Demo flow: Instagram Comment-to-DM (the flagship MVP use case) ---
  // Graph shape matches the FlowGraph type in @flowfable/shared.
  const demoGraph = {
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 0, y: 150 },
        data: {
          triggerType: 'COMMENT',
          config: { keywords: ['price', 'info', 'link'], match: 'contains' },
        },
      },
      {
        id: 'message-1',
        type: 'message',
        position: { x: 300, y: 150 },
        data: {
          content: {
            text: "Hey {{contact.firstName}}! Thanks for commenting 🎉 Here's the link you asked for:",
            buttons: [{ type: 'url', title: 'Open link', url: 'https://example.com/offer' }],
          },
        },
      },
      {
        id: 'condition-1',
        type: 'condition',
        position: { x: 600, y: 150 },
        data: {
          rules: { all: [{ field: 'tag', op: 'has', value: 'vip' }] },
        },
      },
      {
        id: 'message-vip',
        type: 'message',
        position: { x: 900, y: 50 },
        data: { content: { text: 'As a VIP, use code VIP20 for 20% off 💜' } },
      },
      {
        id: 'tag-1',
        type: 'tag',
        position: { x: 900, y: 250 },
        data: { action: 'add', tagName: 'lead' },
      },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'message-1' },
      { id: 'e2', source: 'message-1', target: 'condition-1' },
      { id: 'e3', source: 'condition-1', sourceHandle: 'true', target: 'message-vip' },
      { id: 'e4', source: 'condition-1', sourceHandle: 'false', target: 'tag-1' },
    ],
  };

  const flow = await prisma.flow.upsert({
    where: { id: 'seed-flow-comment-to-dm' },
    update: {},
    create: {
      id: 'seed-flow-comment-to-dm',
      workspaceId: workspace.id,
      name: 'Comment-to-DM: Pricing',
      description: 'Auto-DM anyone who comments "price" on a post, with VIP branching.',
      status: 'PUBLISHED',
    },
  });

  const version = await prisma.flowVersion.upsert({
    where: { flowId_version: { flowId: flow.id, version: 1 } },
    update: { graph: demoGraph },
    create: { flowId: flow.id, version: 1, graph: demoGraph },
  });

  await prisma.flow.update({
    where: { id: flow.id },
    data: { publishedVersionId: version.id },
  });

  await prisma.flowTrigger.upsert({
    where: { id: 'seed-trigger-comment' },
    update: {},
    create: {
      id: 'seed-trigger-comment',
      flowId: flow.id,
      type: 'COMMENT',
      config: { keywords: ['price', 'info', 'link'], match: 'contains' },
    },
  });

  console.log('Seed complete.');
  console.log(`  Workspace: ${workspace.name} (${workspace.slug})`);
  console.log(`  User:      demo@flowfable.dev / demo1234 (dev only)`);
  console.log(`  Flow:      ${flow.name} [PUBLISHED]`);
  console.log(`  Convo:     ${conversation.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
