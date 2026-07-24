type InfoCardProps = {
  label: string;
  value?: string | number | null;
};

export default function InfoCard({
  label,
  value,
}: InfoCardProps) {
  return (
    <div className="bg-pink-50 rounded-lg border border-pink-100 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">
        {value || "Not Provided"}
      </p>
    </div>
  );
}