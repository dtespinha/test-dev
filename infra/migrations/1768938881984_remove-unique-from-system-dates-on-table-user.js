/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Remove as constraints unique dos campos created_at e updated_at
  pgm.dropConstraint("users", "users_created_at_key");
  pgm.dropConstraint("users", "users_updated_at_key");

  // Adiciona a constraint notNull
  pgm.alterColumn("users", "created_at", {
    notNull: true,
  });

  pgm.alterColumn("users", "updated_at", {
    notNull: true,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = false;
