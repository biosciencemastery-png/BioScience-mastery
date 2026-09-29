import { test } from "node:test";
import assert from "node:assert/strict";

import {
  wizardSchema,
  academicSchema,
  studentProfileSchema,
} from "../../src/features/auth/student-validation";

const examId = "00000000-0000-4000-8000-000000000021";

const input = {
  locale: "en",
  display_name: "Test learner",
  email: "test@example.test",
  password: "a-long-password",
  confirm_password: "a-long-password",
  details: {},
  goals: {
    exam_ids: [examId],
    target_year: "",
    marketing: false,
  },
  terms: "on",
  privacy: "on",
  terms_version: "00000000-0000-4000-8000-000000000011",
  privacy_version: "00000000-0000-4000-8000-000000000012",
};

test("registration requires at least one examination and validates consent, password confirmation and academic details", () => {
  assert.ok(wizardSchema.safeParse(input).success);

  for (const patch of [
    { confirm_password: "different" },
    { password: "short", confirm_password: "short" },
    { terms: undefined },
    { privacy: undefined },
    { terms: "off" },
    { terms_version: "" },
    { details: { password: "never-store" } },
    { details: { phone: "<script>" } },
    { details: { gender: "self_describe" } },
    {
      goals: {
        ...input.goals,
        exam_ids: [],
      },
    },
  ]) {
    assert.equal(
      wizardSchema.safeParse({
        ...input,
        ...patch,
      }).success,
      false,
    );
  }

  assert.ok(
    academicSchema.safeParse({
      gender: "prefer_not",
    }).success,
  );

  assert.ok(
    academicSchema.safeParse({
      gender: "self_describe",
      gender_description: "Own description",
    }).success,
  );
});

test("student profile requires an examination and rejects invalid or duplicate goals", () => {
  assert.ok(
    studentProfileSchema.safeParse({
      locale: "hi",
      details: {},
      goals: input.goals,
    }).success,
  );

  assert.equal(
    studentProfileSchema.safeParse({
      locale: "hi",
      details: {},
      goals: {
        ...input.goals,
        exam_ids: [],
      },
    }).success,
    false,
  );

  assert.equal(
    studentProfileSchema.safeParse({
      locale: "hi",
      details: {},
      goals: {
        ...input.goals,
        exam_ids: ["bad"],
      },
    }).success,
    false,
  );

  assert.equal(
    wizardSchema.safeParse({
      ...input,
      goals: {
        ...input.goals,
        target_year: 2000,
      },
    }).success,
    false,
  );

  assert.equal(
    wizardSchema.safeParse({
      ...input,
      goals: {
        ...input.goals,
        exam_ids: [examId, examId],
      },
    }).success,
    false,
  );
});