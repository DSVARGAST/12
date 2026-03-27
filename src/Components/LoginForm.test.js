import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginForm from "./LoginForm";
import { useAuth } from "./AuthContext";

jest.mock("./AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("envia el email limpio y ejecuta onSuccess al iniciar sesion", async () => {
    const login = jest.fn().mockResolvedValue({
      email: "admin@docedigital.test",
      full_name: "Admin Doce",
    });
    const onSuccess = jest.fn();

    useAuth.mockReturnValue({
      login,
      loading: false,
    });

    render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "  admin@docedigital.test  " },
    });
    fireEvent.change(screen.getByLabelText(/contrase/i), {
      target: { value: "editor123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("admin@docedigital.test", "editor123");
    });

    expect(onSuccess).toHaveBeenCalledWith({
      email: "admin@docedigital.test",
      full_name: "Admin Doce",
    });
  });

  test("muestra el error devuelto por login cuando falla", async () => {
    const login = jest.fn().mockRejectedValue(new Error("Credenciales invalidas"));

    useAuth.mockReturnValue({
      login,
      loading: false,
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@docedigital.test" },
    });
    fireEvent.change(screen.getByLabelText(/contrase/i), {
      target: { value: "mala-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(await screen.findByText("Credenciales invalidas")).toBeInTheDocument();
  });
});
