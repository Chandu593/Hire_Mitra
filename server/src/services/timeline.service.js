import TimelineEvent from '../models/TimelineEvent.js';

export function createTimelineEvent(data) {
  return TimelineEvent.create(data);
}
