import { render } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

import { DatePill } from './DatePill';
import { DateSelector, getDeskDateOptions } from './DateSelector';

describe('DateSelector', () => {
  it('ofrece los proximos 30 dias y conserva visible la fecha seleccionada', () => {
    const selectedDate = getDeskDateOptions(new Date(), 30)[20].id;
    const view = render(
      <DateSelector selectedDate={selectedDate} onSelectDate={jest.fn()} />,
    );

    const pills = view.UNSAFE_getAllByType(DatePill);
    expect(pills).toHaveLength(30);
    expect(pills.find((pill) => pill.props.selected)?.props).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });

  it('configura el desplazamiento horizontal con salto semanal', () => {
    const selectedDate = getDeskDateOptions()[0].id;
    const view = render(
      <DateSelector selectedDate={selectedDate} onSelectDate={jest.fn()} />,
    );

    const scrollView = view.UNSAFE_getByType(ScrollView);
    expect(scrollView.props.horizontal).toBe(true);
    expect(scrollView.props.snapToInterval).toBeGreaterThan(0);
    expect(scrollView.props.decelerationRate).toBe('fast');
  });
});
