import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./Components/SecureDashboard", () => function SecureDashboardMock() {
  return <div>SecureDashboard listo</div>;
});

describe("App", () => {
  test("renderiza el dashboard principal", () => {
    render(<App />);
    expect(screen.getByText("SecureDashboard listo")).toBeInTheDocument();
  });
});
