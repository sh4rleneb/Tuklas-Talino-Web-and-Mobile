import {
  Student,
  Teacher,
  User,
} from '../models/index.js';

export function normalizeAccountText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en-US');
}

function normalizeAccountIdentifier(value) {
  return normalizeAccountText(value);
}

function normalizeAccountEmail(value) {
  return normalizeAccountText(value);
}

function plainRecord(record) {
  if (!record) return null;

  return typeof record.get === 'function'
    ? record.get({ plain: true })
    : record;
}

function duplicateStatus(profile, user) {
  return (
    profile?.status === 'archived' ||
    user?.status === 'archived'
  )
    ? 'archived'
    : 'active';
}

function duplicateResult({
  accountType,
  field,
  profile,
  user,
}) {
  return {
    accountType,
    field,
    status: duplicateStatus(profile, user),
  };
}

export async function findDuplicateAccount({
  accountType,
  name,
  email,
  username,
  code,
}) {
  if (!['student', 'teacher'].includes(accountType)) {
    throw new TypeError(
      'accountType must be student or teacher.'
    );
  }

  const Profile =
    accountType === 'student'
      ? Student
      : Teacher;

  const codeField =
    accountType === 'student'
      ? 'studentCode'
      : 'employeeCode';

  const normalizedName =
    normalizeAccountText(name);

  const normalizedCode =
    normalizeAccountIdentifier(code);

  const profiles = await Profile.findAll({
    attributes: [
      'id',
      'userId',
      'name',
      'status',
      codeField,
    ],
    include: [
      {
        model: User,
        attributes: [
          'id',
          'username',
          'email',
          'displayName',
          'status',
        ],
        required: false,
      },
    ],
  });

  const matches = [];

  for (const profileRecord of profiles) {
    const profile = plainRecord(profileRecord);
    const user = plainRecord(profile?.User);

    const candidateNames = [
      profile?.name,
      user?.displayName,
    ]
      .map(normalizeAccountText)
      .filter(Boolean);

    if (
      normalizedName &&
      candidateNames.includes(normalizedName)
    ) {
      matches.push({
        accountType,
        field: 'name',
        profile,
        user,
      });
    }

    if (
      normalizedCode &&
      normalizeAccountIdentifier(
        profile?.[codeField]
      ) === normalizedCode
    ) {
      matches.push({
        accountType,
        field: codeField,
        profile,
        user,
      });
    }
  }

  const normalizedUsername =
    normalizeAccountIdentifier(username);

  const normalizedEmail =
    normalizeAccountEmail(email);

  if (normalizedUsername || normalizedEmail) {
    const users = await User.findAll({
      attributes: [
        'id',
        'username',
        'email',
        'status',
      ],
    });

    for (const userRecord of users) {
      const user = plainRecord(userRecord);

      if (
        normalizedUsername &&
        normalizeAccountIdentifier(
          user?.username
        ) === normalizedUsername
      ) {
        matches.push({
          accountType,
          field: 'username',
          profile: null,
          user,
        });
      }

      if (
        normalizedEmail &&
        normalizeAccountEmail(
          user?.email
        ) === normalizedEmail
      ) {
        matches.push({
          accountType,
          field: 'email',
          profile: null,
          user,
        });
      }
    }
  }

  if (!matches.length) {
    return null;
  }

  const statusPriority = {
    active: 0,
    archived: 1,
  };

  const fieldPriority = {
    username: 0,
    email: 1,
    studentCode: 2,
    employeeCode: 2,
    name: 3,
  };

  matches.sort((left, right) => {
    const leftStatus =
      duplicateStatus(
        left.profile,
        left.user
      );

    const rightStatus =
      duplicateStatus(
        right.profile,
        right.user
      );

    const statusDifference =
      statusPriority[leftStatus] -
      statusPriority[rightStatus];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const fieldDifference =
      (fieldPriority[left.field] ?? 99) -
      (fieldPriority[right.field] ?? 99);

    if (fieldDifference !== 0) {
      return fieldDifference;
    }

    const leftId = Number(
      left.profile?.id ??
      left.user?.id ??
      0
    );

    const rightId = Number(
      right.profile?.id ??
      right.user?.id ??
      0
    );

    return leftId - rightId;
  });

  return duplicateResult(matches[0]);
}

export function duplicateAccountPayload(
  duplicate,
  {
    publicMessage = false,
  } = {}
) {
  if (publicMessage) {
    return {
      message:
        'An account with the same name, username, email, or code already exists.',
      code: 'ACCOUNT_ALREADY_EXISTS',
    };
  }

  const accountLabel =
    duplicate.accountType === 'teacher'
      ? 'teacher'
      : 'student';

  const fieldLabels = {
    name: 'name',
    username: 'username',
    email: 'email address',
    studentCode: 'student code',
    employeeCode: 'employee code',
  };

  const fieldLabel =
    fieldLabels[duplicate.field] ||
    'account information';

  const archived =
    duplicate.status === 'archived';

  return {
    message: archived
      ? `An archived ${accountLabel} account with the same ${fieldLabel} already exists. Reactivate the existing account from Archive instead of creating a duplicate.`
      : `A ${accountLabel} account with the same ${fieldLabel} already exists.`,
    code: archived
      ? 'ARCHIVED_ACCOUNT_EXISTS'
      : 'ACCOUNT_ALREADY_EXISTS',
    conflictField: duplicate.field,
    existingStatus: duplicate.status,
  };
}
