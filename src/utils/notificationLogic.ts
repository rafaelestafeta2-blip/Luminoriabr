export interface BlueprintSanitizedNotification {
  notificationId: string;
  userId: string;
  type: 'epg_reminder' | 'cinema_invite';
  title: string;
  message: string;
  targetId: string;
  read: boolean;
}

const ALLOWED_NOTIFICATION_TYPES = ['epg_reminder', 'cinema_invite'] as const;

export function sanitizeNotificationForBlueprint(input: {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  targetId: string;
  read: boolean;
}): BlueprintSanitizedNotification {
  const safeNotifId =
    (input.notificationId || 'notif-1').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128) || 'notif-1';
  const safeUserId =
    (input.userId || 'anon').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128) || 'anon';
  const safeType = (ALLOWED_NOTIFICATION_TYPES as readonly string[]).includes(input.type)
    ? (input.type as BlueprintSanitizedNotification['type'])
    : 'epg_reminder';

  const trimmedTitle = (input.title || 'Alerta Luminoria').trim().slice(0, 80);
  const safeTitle = trimmedTitle.length >= 2 ? trimmedTitle : 'Alerta Luminoria';

  const trimmedMessage = (input.message || 'Novo evento na plataforma.').trim().slice(0, 220);
  const safeMessage =
    trimmedMessage.length >= 2 ? trimmedMessage : 'Novo evento na plataforma.';

  const rawTarget = (input.targetId || 'ch-1').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64);
  const safeTargetId = rawTarget.length >= 1 ? rawTarget : 'ch-1';

  return {
    notificationId: safeNotifId,
    userId: safeUserId,
    type: safeType,
    title: safeTitle,
    message: safeMessage,
    targetId: safeTargetId,
    read: Boolean(input.read),
  };
}

export function buildEpgReminderNotification(params: {
  userId: string;
  channelId: string;
  channelName: string;
  programTitle: string;
  startTime: string;
  notificationId?: string;
}): BlueprintSanitizedNotification {
  const id =
    params.notificationId ||
    `epg-${params.channelId.replace(/[^a-zA-Z0-9_\-]/g, '')}-${Date.now()}`;
  return sanitizeNotificationForBlueprint({
    notificationId: id,
    userId: params.userId,
    type: 'epg_reminder',
    title: `Guia EPG · ${params.channelName}`,
    message: `O programa favorito "${params.programTitle}" começa às ${params.startTime}. Sintonize agora!`,
    targetId: params.channelId,
    read: false,
  });
}

export function buildCinemaFriendJoinNotification(params: {
  userId: string;
  friendName: string;
  roomCode: string;
  movieTitle?: string;
  notificationId?: string;
}): BlueprintSanitizedNotification {
  const cleanCode = params.roomCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'LUMI92';
  const id = params.notificationId || `cinema-${cleanCode}-${Date.now()}`;
  const suffix = params.movieTitle ? ` para assistir "${params.movieTitle}"` : '';
  return sanitizeNotificationForBlueprint({
    notificationId: id,
    userId: params.userId,
    type: 'cinema_invite',
    title: `Sala de Cinema #${cleanCode}`,
    message: `Seu amigo ${params.friendName} acabou de entrar na Sala #${cleanCode}${suffix}!`,
    targetId: cleanCode,
    read: false,
  });
}
