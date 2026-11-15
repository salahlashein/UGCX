export interface TaskLike {
  id?: string;
  collaborationId?: string;
  actionUrl?: string;
}

/**
 * Maps a home queue task to its web route.
 */
export function taskToWebRoute(task: TaskLike | string): string {
  const taskId = typeof task === 'string' ? task : task?.id || '';

  if (taskId.startsWith('msg-')) {
    const id = taskId.slice('msg-'.length);
    return `/chats/${id}`;
  }

  if (taskId.startsWith('rev-')) {
    const id = taskId.slice('rev-'.length);
    return `/creator/work/${id}`;
  }

  if (taskId.startsWith('deliv-')) {
    const id = taskId.slice('deliv-'.length);
    return `/creator/work/${id}`;
  }

  if (taskId.startsWith('ship-')) {
    const id = taskId.slice('ship-'.length);
    return `/creator/work/${id}`;
  }

  if (taskId.startsWith('await-ship-')) {
    const id = taskId.slice('await-ship-'.length);
    return `/creator/work/${id}`;
  }

  if (typeof task !== 'string' && task.collaborationId) {
    return `/creator/work/${task.collaborationId}`;
  }

  return '/creator/work';
}
