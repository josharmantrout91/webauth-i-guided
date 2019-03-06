exports.up = function(knex, Promise) {
  return knex.schema.table("users", users => {
    users.string("role", 128);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table("users", users => {
    users.dropColumn("role");
  });
};
