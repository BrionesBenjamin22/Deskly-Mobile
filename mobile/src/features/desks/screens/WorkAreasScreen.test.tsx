import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import {
  listAvailableWorkAreas,
  listLocalities,
  listWorkAreas,
} from "../services/desks.service";
import { buildLocality, buildWorkArea } from "../testing/desk.fixtures";
import { WorkAreasScreen } from "./WorkAreasScreen";
import { AuthProvider } from "../../auth/context/AuthContext";
import type { LoginResponse } from "../../auth/types/auth.types";

jest.mock("../services/desks.service", () => ({
  DeskServiceError: class DeskServiceError extends Error {},
  listAvailableWorkAreas: jest.fn(),
  listLocalities: jest.fn(),
  listWorkAreas: jest.fn(),
}));

const mockedListLocalities = jest.mocked(listLocalities);
const mockedListWorkAreas = jest.mocked(listWorkAreas);
const mockedListAvailableWorkAreas = jest.mocked(listAvailableWorkAreas);

const session: LoginResponse = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  user: {
    id: "member-1",
    email: "member@deskly.test",
    username: "member",
    role: "MIEMBRO",
    active: true,
    member: {
      id: "member-1",
      fullName: "Miembro Deskly",
      active: true,
    },
  },
};

function renderScreen(props: React.ComponentProps<typeof WorkAreasScreen>) {
  return render(
    <AuthProvider session={session}>
      <WorkAreasScreen {...props} />
    </AuthProvider>,
  );
}

describe("WorkAreasScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const center = buildLocality();
    const north = buildLocality({ id: "locality-2", name: "Sede Norte" });
    const coast = buildLocality({ id: "locality-3", name: "Sede Costanera" });
    const centerArea = buildWorkArea({
      locality: center,
      localityId: center.id,
    });
    const northArea = buildWorkArea({
      id: "area-2",
      name: "Laboratorio Digital",
      locality: north,
      localityId: north.id,
    });

    mockedListLocalities.mockResolvedValue([center, north, coast]);
    mockedListWorkAreas.mockResolvedValue([centerArea, northArea]);
    mockedListAvailableWorkAreas.mockResolvedValue([centerArea, northArea]);
  });

  it("muestra las areas de trabajo disponibles al ingresar", async () => {
    renderScreen({ onSelectWorkArea: jest.fn() });

    expect(await screen.findByText("Sala Norte")).toBeOnTheScreen();
    expect(screen.getAllByText("Sede Centro")).toHaveLength(2);
    expect(screen.getAllByText("2 disponibles")).toHaveLength(2);
  });

  it("vuelve a consultar las areas con pull-to-refresh", async () => {
    renderScreen({ onSelectWorkArea: jest.fn() });
    await screen.findByText("Sala Norte");

    await act(async () => {
      await screen.getByTestId("work-areas-scroll").props.refreshControl.props.onRefresh();
    });

    expect(mockedListWorkAreas).toHaveBeenCalledTimes(2);
    expect(mockedListAvailableWorkAreas).toHaveBeenCalledTimes(2);
  });

  it("filtra las areas por la localidad seleccionada", async () => {
    renderScreen({ onSelectWorkArea: jest.fn() });

    expect(await screen.findByText("Laboratorio Digital")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Filtrar por Sede Centro"));

    expect(screen.getByText("Sala Norte")).toBeOnTheScreen();
    expect(screen.queryByText("Laboratorio Digital")).not.toBeOnTheScreen();
  });

  it("actualiza el listado al cambiar y limpiar el filtro", async () => {
    renderScreen({ onSelectWorkArea: jest.fn() });

    await screen.findByText("Sala Norte");
    fireEvent.press(screen.getByLabelText("Filtrar por Sede Centro"));
    fireEvent.press(screen.getByLabelText("Filtrar por Sede Norte"));

    expect(screen.queryByText("Sala Norte")).not.toBeOnTheScreen();
    expect(screen.getByText("Laboratorio Digital")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Mostrar todas las localidades"));

    expect(screen.getByText("Sala Norte")).toBeOnTheScreen();
    expect(screen.getByText("Laboratorio Digital")).toBeOnTheScreen();
  });

  it("muestra un estado vacio si la localidad no tiene areas", async () => {
    renderScreen({ onSelectWorkArea: jest.fn() });

    await screen.findByText("Sala Norte");
    fireEvent.press(screen.getByLabelText("Filtrar por Sede Costanera"));

    expect(
      screen.getByText("No hay areas disponibles para esta localidad."),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Sala Norte")).not.toBeOnTheScreen();
    expect(screen.queryByText("Laboratorio Digital")).not.toBeOnTheScreen();
  });

  it("permite seleccionar un area conservando fecha y horario", async () => {
    const onSelectWorkArea = jest.fn();
    const area = buildWorkArea();
    mockedListWorkAreas.mockResolvedValue([area]);
    mockedListAvailableWorkAreas.mockResolvedValue([area]);

    renderScreen({ onSelectWorkArea });

    fireEvent.press(await screen.findByText("Sala Norte"));
    fireEvent.press(screen.getByText("Ver Escritorios"));

    await waitFor(() => {
      expect(onSelectWorkArea).toHaveBeenCalledWith(
        expect.objectContaining({ id: "area-1" }),
        expect.objectContaining({ startTime: "09:00", endTime: "18:00" }),
      );
    });
  });
});
