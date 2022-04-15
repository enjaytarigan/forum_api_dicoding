/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.addColumns('comments', {
    is_delete: { type: 'boolean', default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('comments', 'is_delete');
};
