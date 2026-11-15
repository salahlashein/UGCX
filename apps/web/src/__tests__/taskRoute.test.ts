import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { taskToWebRoute } from '../utils/taskRoute';

describe('taskToWebRoute', () => {
  it('maps msg-<id> to /chats/<id>', () => {
    assert.equal(taskToWebRoute('msg-collab-123'), '/chats/collab-123');
    assert.equal(taskToWebRoute({ id: 'msg-collab-456' }), '/chats/collab-456');
  });

  it('maps rev-<id> and deliv-<id> to /creator/work/<id>', () => {
    assert.equal(taskToWebRoute('rev-collab-101'), '/creator/work/collab-101');
    assert.equal(taskToWebRoute('deliv-collab-102'), '/creator/work/collab-102');
  });

  it('maps ship-<id> and await-ship-<id> to /creator/work/<id>', () => {
    assert.equal(taskToWebRoute('ship-collab-201'), '/creator/work/collab-201');
    assert.equal(taskToWebRoute('await-ship-collab-202'), '/creator/work/collab-202');
  });

  it('maps an unknown prefix to /creator/work', () => {
    assert.equal(taskToWebRoute('random-task-301'), '/creator/work');
    assert.equal(taskToWebRoute(''), '/creator/work');
  });
});
