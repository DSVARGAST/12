const {
  buildPublicationFilters,
  buildPublicationQuery,
  filterPublicationsBySearch,
} = require('./publications');

describe('publications utils', () => {
  test('buildPublicationFilters incluye filtros numericos incluso cuando valen 0', () => {
    expect(
      buildPublicationFilters({
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        minLikes: 0,
        maxLikes: 50,
      })
    ).toEqual({
      where: [
        'DATE(created_at) >= ?',
        'DATE(created_at) <= ?',
        'total_likes >= ?',
        'total_likes <= ?',
      ],
      params: ['2026-03-01', '2026-03-31', 0, 50],
    });
  });

  test('buildPublicationQuery arma el SQL esperado con orden descendente', () => {
    const { sql, params } = buildPublicationQuery({ minLikes: 10 });

    expect(sql).toContain('FROM publications');
    expect(sql).toContain('WHERE total_likes >= ?');
    expect(sql).toContain('ORDER BY created_at DESC');
    expect(params).toEqual([10]);
  });

  test('filterPublicationsBySearch filtra por contenido sin importar mayusculas', () => {
    const data = [
      { publication_id: 1, content: 'Lanzamiento de campaña' },
      { publication_id: 2, content: 'Reporte semanal' },
      { publication_id: 3, content: 'CAMPAÑA cerrada' },
    ];

    expect(filterPublicationsBySearch(data, 'campaña')).toEqual([
      { publication_id: 1, content: 'Lanzamiento de campaña' },
      { publication_id: 3, content: 'CAMPAÑA cerrada' },
    ]);
  });
});
