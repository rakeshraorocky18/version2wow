import { Calendar, Heart, MapPin } from "lucide-react";

type Props = {
  profile: any;
  calculateAge: (dob?: string) => string | number;
};

export default function PublicProfileHeader({
  profile,
  calculateAge,
}: Props) {
  return (
    <>
      <div className="h-52 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600"></div>

      <div className="-mt-16 flex flex-col items-center px-8">

        <img
          src={
            profile.profileImage
              ? `http://localhost:3000${profile.profileImage}`
              : "/default-avatar.png"
          }
          alt={profile.firstName}
          className="w-40 h-40 rounded-full border-4 border-white object-cover shadow-lg"
        />

        <h1 className="text-3xl font-bold mt-4">
          {profile.firstName}
        </h1>

        <div className="flex flex-wrap justify-center gap-6 mt-4 text-gray-600">

          <div className="flex items-center gap-2">
            <Calendar size={18} />
            {calculateAge(profile.dateOfBirth)} Years
          </div>

          <div className="flex items-center gap-2">
            <Heart size={18} />
            {profile.religion || "Not Provided"}
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={18} />
            {profile.city || "Not Provided"}
          </div>

        </div>
      </div>
    </>
  );
}