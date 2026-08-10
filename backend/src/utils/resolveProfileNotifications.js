import { Op } from 'sequelize';
import { Notification } from '../models/notification.js';
import { PROFILE_INCOMPLETE_KEY } from './profileCompletion.js';

// Reminders raised before notifications carried a key are recognised by their title,
// so long-standing ones retire too instead of sitting there for ever.
const LEGACY_PROFILE_TITLE = 'Complete your profile';

export const resolveProfileNotifications = (recipientId) => Notification.update(
  { resolvedAt: new Date() },
  {
    where: {
      recipientId,
      resolvedAt: null,
      [Op.or]: [
        { key: PROFILE_INCOMPLETE_KEY },
        { key: null, title: LEGACY_PROFILE_TITLE },
      ],
    },
  }
);

export default resolveProfileNotifications;
