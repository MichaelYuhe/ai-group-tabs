import { HTMLAttributes, forwardRef, useState } from "react";
import { Color, TabColorConfig } from "../const";

const ColorCircle = ({
  color,
  selected = false,
  onClick,
}: {
  color: Color;
  selected?: boolean;
  onClick: () => void;
}) => {
  const DEFAULT_COLOR =
    "linear-gradient(to right, rgb(228, 144, 134) 0%, rgb(147, 179, 242) 100%)";
  const colorValue =
    TabColorConfig.find((c) => c.name === color)?.value ?? DEFAULT_COLOR;
  return (
    <input
      type="checkbox"
      className="w-4 h-4 rounded-full border-transparent checked:bg-transparent checked:ring-2 checked:ring-offset-2 focus:outline-none checked:bg-none"
      style={
        {
          background: colorValue,
          "--tw-ring-color": colorValue,
        } as React.CSSProperties
      }
      checked={selected}
      onClick={onClick}
    ></input>
  );
};

const ColorPickerPopup = forwardRef<
  HTMLDivElement,
  {
    selected: Color;
    onChange: (newColor: Color) => void;
    onClose?: () => void;
  }
>(({ selected, onChange, onClose }, ref) => {
  return (
    <>
      <div
        ref={ref}
        className="absolute z-10 -translate-x-1/2 translate-y-2 grid grid-cols-3 gap-3 p-3 bg-white rounded-lg shadow-lg"
      >
        {TabColorConfig.map(({ name: colorOption }) => (
          <ColorCircle
            key={colorOption}
            color={colorOption}
            selected={selected === colorOption}
            onClick={() => {
              onChange(colorOption);
            }}
          />
        ))}
      </div>
      {/* overlay mask */}
      <div className="fixed inset-0 w-screen h-screen z-1" onClick={onClose} />
    </>
  );
});

export const ColorPicker = ({
  color,
  onChange,
  ...props
}: {
  color: Color;
  onChange: (newColor: Color) => void;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange">) => {
  const [show, setShow] = useState<boolean>(false);
  return (
    <div {...props}>
      <ColorCircle key={color} color={color} onClick={() => setShow(!show)} />
      {show && (
        <ColorPickerPopup
          selected={color}
          onChange={(newColor) => {
            onChange(newColor);
            setShow(false);
          }}
          onClose={() => setShow(false)}
        />
      )}
    </div>
  );
};
