import { fireEvent, render, screen } from "@testing-library/react-native";

import {
  buildReservation,
  buildReservationWithPartialLocation,
  buildReservationWithoutLocation,
} from "../testing/reservation.fixtures";
import { ReservationCard } from "./ReservationCard";
import { ReservationList } from "./ReservationList";

describe("ReservationCard location details", () => {
  it("abre y cierra los datos geograficos sin ocultar el resumen", () => {
    const reservation = buildReservation();
    render(<ReservationCard reservation={reservation} />);

    expect(screen.getByText(reservation.deskName)).toBeOnTheScreen();
    expect(screen.queryByText("Area abierta")).not.toBeOnTheScreen();

    const toggle = screen.getByRole("button", {
      name: "Ver detalles de ubicación",
    });
    expect(toggle.props.accessibilityState).toEqual({ expanded: false });
    fireEvent.press(toggle);

    expect(screen.getByText("Area abierta")).toBeOnTheScreen();
    expect(screen.getByText("Chascomus")).toBeOnTheScreen();
    expect(screen.getByText("Av. Costanera Espana 120")).toBeOnTheScreen();
    expect(screen.getByText("-35.577, -57.997")).toBeOnTheScreen();
    expect(screen.getByLabelText("Mapa de Area abierta")).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", { name: "Ocultar detalles de ubicación" }),
    );
    expect(screen.queryByText("Area abierta")).not.toBeOnTheScreen();
  });

  it("omite valores opcionales ausentes y no ofrece detalle sin ubicacion", () => {
    const { unmount } = render(
      <ReservationCard reservation={buildReservationWithPartialLocation()} />,
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Ver detalles de ubicación" }),
    );
    expect(screen.queryByText("Coordenadas")).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/Mapa de/)).not.toBeOnTheScreen();
    expect(screen.queryByText(/undefined|null/)).not.toBeOnTheScreen();
    unmount();

    render(<ReservationCard reservation={buildReservationWithoutLocation()} />);
    expect(
      screen.queryByRole("button", { name: "Ver detalles de ubicación" }),
    ).not.toBeOnTheScreen();
  });

  it("omite coordenadas y mapa cuando los valores estan fuera de rango", () => {
    render(
      <ReservationCard
        reservation={buildReservation({
          location: {
            areaId: "area-1",
            areaName: "Area abierta",
            localityId: "locality-1",
            localityName: "Chascomus",
            latitude: 120,
            longitude: -200,
          },
        })}
      />,
    );

    fireEvent.press(
      screen.getByRole("button", { name: /Ver detalles de ubicaci/ }),
    );

    expect(screen.queryByText("Coordenadas")).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/Mapa de/)).not.toBeOnTheScreen();
  });

  it("mantiene independiente el detalle de cada tarjeta", () => {
    render(
      <ReservationList
        reservations={[
          buildReservation(),
          buildReservation({
            id: "reservation-2",
            deskName: "Escritorio patio",
            location: {
              areaId: "area-2",
              areaName: "Sala Sur",
              localityId: "locality-2",
              localityName: "La Plata",
            },
          }),
        ]}
      />,
    );

    fireEvent.press(
      screen.getAllByRole("button", { name: "Ver detalles de ubicación" })[1],
    );
    expect(screen.getByText("Sala Sur")).toBeOnTheScreen();
    expect(screen.queryByText("Area abierta")).not.toBeOnTheScreen();
    expect(screen.getByText("Escritorio ventana")).toBeOnTheScreen();
    expect(screen.getByText("Escritorio patio")).toBeOnTheScreen();
  });
});
