import { FC } from 'react';
import { configure, view, ViewModel } from '@yoskutik/react-vvm';
import { render } from '@testing-library/react/pure';
import '@testing-library/react/dont-cleanup-after-each';
import { cleanup } from '@testing-library/react';

describe('Common use of ViewModel', () => {
  let viewModel: SomeViewModel;

  configure({
    vmFactory: VM => viewModel = new VM() as any,
  });

  type ViewProps = { prop1: number, prop2?: number };

  class SomeViewModel extends ViewModel<unknown, ViewProps> {
    onViewUnmounted = jest.fn();

    onViewMounted = jest.fn();

    onViewUpdated = jest.fn();
  }

  const View: FC<ViewProps> = view(SomeViewModel)(({ prop1 }) => (
    <div>{prop1}</div>
  ));

  describe('View lifecycle', () => {
    const checkHooks = (a: number, b: number, c: number) => {
      expect(viewModel.onViewMounted).toBeCalledTimes(a);
      expect(viewModel.onViewUpdated).toBeCalledTimes(b);
      expect(viewModel.onViewUnmounted).toBeCalledTimes(c);
    };

    const { rerender } = render(<View prop1={0} />);

    test('View has been mounted', () => {
      checkHooks(1, 0, 0);
    });

    test('View updates with no changed props', () => {
      rerender(<View prop1={0} />);
      checkHooks(1, 0, 0);
    });

    test('View updates with changed props', () => {
      rerender(<View prop1={1} />);
      checkHooks(1, 1, 0);
      expect(viewModel.onViewUpdated).toBeCalledWith({ prop1: 1 });
    });

    test('View has been unmounted', () => {
      cleanup();
      checkHooks(1, 1, 1);
    });
  });

  test('ViewProps equality', () => {
    const { rerender } = render(<View prop1={0} />);

    const checkProps = (props: ViewProps, shouldRerender = true) => {
      shouldRerender && rerender(<View {...props} />);
      expect(viewModel.viewProps).toEqual(props);
    };

    checkProps({ prop1: 0 }, false);
    checkProps({ prop1: 1 });
    checkProps({ prop1: 1, prop2: 3 });
    checkProps({ prop1: 1 });
  });

  test('Parent equality', () => {
    class ChildViewModel extends ViewModel<SomeViewModel> {}

    const ViewChild = view(ChildViewModel)(() => <div />);

    const SomeView = view(SomeViewModel)(() => <ViewChild />);

    render(<SomeView />);

    expect(viewModel.parent).toBeInstanceOf(SomeViewModel);
  });
});