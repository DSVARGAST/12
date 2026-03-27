function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function buildPublicationFilters(query = {}) {
  const { startDate, endDate, minLikes, maxLikes } = query;
  const where = [];
  const params = [];

  if (hasValue(startDate)) {
    where.push("DATE(created_at) >= ?");
    params.push(startDate);
  }

  if (hasValue(endDate)) {
    where.push("DATE(created_at) <= ?");
    params.push(endDate);
  }

  if (hasValue(minLikes)) {
    where.push("total_likes >= ?");
    params.push(Number(minLikes) || 0);
  }

  if (hasValue(maxLikes)) {
    where.push("total_likes <= ?");
    params.push(Number(maxLikes) || 0);
  }

  return { where, params };
}

function buildPublicationQuery(query = {}) {
  const { where, params } = buildPublicationFilters(query);
  const sql = `SELECT publication_id, content, image_url, total_likes, total_comments, total_shares, created_at
    FROM publications
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY created_at DESC`;

  return { sql, params };
}

function filterPublicationsBySearch(publications = [], search) {
  if (!String(search || "").trim()) {
    return publications;
  }

  const query = String(search).toLowerCase();
  return publications.filter((publication) =>
    String(publication.content || "").toLowerCase().includes(query)
  );
}

module.exports = {
  buildPublicationFilters,
  buildPublicationQuery,
  filterPublicationsBySearch,
};
