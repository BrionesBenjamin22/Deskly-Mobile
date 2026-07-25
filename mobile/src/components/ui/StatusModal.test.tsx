import { fireEvent, render, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';

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
});
