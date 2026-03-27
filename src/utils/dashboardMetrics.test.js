import {
  buildLinePath,
  deriveDashboardData,
  formatDate,
} from "./dashboardMetrics";

describe("dashboardMetrics", () => {
  test("buildLinePath arma un path SVG con los puntos dados", () => {
    expect(
      buildLinePath([
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 60 },
      ])
    ).toBe("M 10 20 L 30 40 L 50 60");
  });

  test("formatDate devuelve un fallback legible si no hay fecha", () => {
    expect(formatDate(null)).toBe("Sin fecha");
  });

  test("deriveDashboardData calcula metricas, dias y distribucion", () => {
    const publications = [
      {
        publication_id: 1,
        total_likes: 10,
        total_comments: 5,
        total_shares: 2,
        created_at: "2026-03-23T10:00:00Z",
      },
      {
        publication_id: 2,
        total_likes: 0,
        total_comments: 3,
        total_shares: 1,
        created_at: "2026-03-24T10:00:00Z",
      },
      {
        publication_id: 3,
        total_likes: 6,
        total_comments: 0,
        total_shares: 0,
        created_at: "2026-03-29T10:00:00Z",
      },
    ];

    const users = [{ id: 1 }, { id: 2 }];
    const data = deriveDashboardData(publications, users);

    expect(data.stats[0]).toMatchObject({
      label: "Seguidores Totales",
      value: "14.699",
      change: "+7.5% vs mes anterior",
    });

    expect(data.stats[1]).toMatchObject({
      label: "Engagement Rate",
      value: "0.2%",
      change: "+1.5% vs mes anterior",
    });

    expect(data.stats[2]).toMatchObject({
      label: "Posts Publicados",
      value: "3",
      change: "+1 vs mes anterior",
    });

    expect(data.chartPoints.find((point) => point.label === "Lun")).toMatchObject({
      value: 17,
      x: 56,
      y: 60,
    });

    expect(data.chartPoints.find((point) => point.label === "Mar")).toMatchObject({
      value: 4,
      x: 164,
    });

    expect(data.chartPoints.find((point) => point.label === "Dom")).toMatchObject({
      value: 6,
      x: 704,
    });

    expect(data.platformData).toEqual([
      { name: "Instagram", value: 63, color: "#e72f6f" },
      { name: "Twitter", value: 15, color: "#2d9bf0" },
      { name: "Facebook", value: 22, color: "#4a6fb9" },
      { name: "LinkedIn", value: 0, color: "#0b76b7" },
    ]);

    expect(data.donutSegments).toHaveLength(4);
    expect(data.maxValue).toBe(17);
  });
});
