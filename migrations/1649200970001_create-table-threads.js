/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('threads', {
    id: { type: 'VARCHAR(50)', notNull: true, primaryKey: true },
    title: { type: 'VARCHAR(1000)', notNull: true },
    body: { type: 'TEXT', notNull: true },
    owner: { type: 'VARCHAR(50)' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint(
    'threads',
    'fk.threads.owner_users.id',
    'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('threads');
};
