const Joi = require("joi");

const changeUserStatusSchema = Joi.object({
  status: Joi.string().valid("ACTIVE", "BANNED", "UNVERIFIED").required(),
});

const changeUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid("USER", "PREMIUM", "ADMIN", "SUPER_ADMIN")
    .required(),
});

const serviceSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow("", null),
  status: Joi.string().valid("VISIBLE", "HIDDEN").default("VISIBLE"),
});

const createSystemFlashcardSetSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow("", null).optional(),
  service_id: Joi.number().integer().required(),
  flashcards: Joi.array()
    .items(
      Joi.object({
        word: Joi.string().required(),
        meaning: Joi.string().required(),
        pronunciation: Joi.string().allow("", null),
        example_sentence: Joi.string().allow("", null),
        part_of_speech: Joi.string().allow("", null),
      }),
    )
    .min(1)
    .required(),
});

const createStaffSchema = Joi.object({
  email: Joi.string().email().required(),
  full_name: Joi.string().min(2).required(),
  password: Joi.string().min(6).required(),
});

const resetStaffPasswordSchema = Joi.object({
  new_password: Joi.string().min(6).required(),
});

module.exports = {
  changeUserStatusSchema,
  changeUserRoleSchema,
  serviceSchema,
  createSystemFlashcardSetSchema,
  createStaffSchema,
  resetStaffPasswordSchema,
};
