import { fireEvent, render, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { Icon } from './Icon';
import { StatusModal } from './StatusModal';

describe('StatusModal', () => {
  afterEach(() => jest.restoreAllMocks());

  it('anima el icono y permite una accion explicita durante la carga', () => {
    const onAction = jest.fn();
    const loop = jest.spyOn(Animated, 'loop');

    render(
      <StatusModal
        visible
        type="loading"
        title="Esperando confirmacion"
        actionLabel="Dejar de esperar"
        onAction={onAction}
      />,
    );

    expect(loop).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Dejar de esperar'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('usa glifos simples dentro del circulo de estado', () => {
    const successView = render(
      <StatusModal visible type="success" title="Operacion confirmada" />,
    );

    expect(successView.UNSAFE_getByType(Icon).props.name).toBe('check');
    successView.unmount();

    const view = render(
      <StatusModal visible type="error" title="No pudimos iniciar sesion" />,
    );

    expect(view.UNSAFE_getByType(Icon).props.name).toBe('x');
  });
});
