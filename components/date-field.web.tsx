import { Colors } from "../constants/colors";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// Web : <input type="date"> ouvre le calendrier natif du navigateur et son
// format ("YYYY-MM-DD") correspond déjà exactement à ce qu'on stocke — pas de
// conversion nécessaire, contrairement à la version native (date-field.tsx).
export default function DateField({ value, onChange, placeholder }: Props) {
  return (
    <input
      type="date"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: 46,
        width: "100%",
        boxSizing: "border-box",
        border: `1px solid ${Colors.grayMedium}`,
        borderRadius: 12,
        paddingLeft: 14,
        paddingRight: 14,
        fontSize: 14,
        fontFamily: "inherit",
        color: Colors.text,
        marginBottom: 14,
        backgroundColor: Colors.surface,
      }}
    />
  );
}
