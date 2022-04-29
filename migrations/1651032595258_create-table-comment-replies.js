/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('comment_replies', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    content: {
      type: 'TEXT',
      notNull: true,
    },
    comment_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    is_delete: {
      type: 'boolean',
      default: false,
    },
  });

  pgm.addConstraint(
    'comment_replies',
    'fk.comment_replies.comment_id-comments.id',
    'FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('comment_replies');
};
