import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { agentService } from '../services/agent/agentService';
// import { MapPin, Calendar, Heart } from "lucide-react";
import InfoCard from "../components/public/InfoCard";
import PublicProfileHeader from "../components/public/PublicProfileHeader";

export default function PublicProfile() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;

    const loadProfile = async () => {
      try {
        console.log("Loading profile:", profileId);

        const data = await agentService.getPublicProfile(profileId);

        console.log("PROFILE DATA:", data);

        setProfile(data);
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileId]);

  if (loading) return <h2>Loading...</h2>;

  if (!profile) return <h2>Profile not found</h2>;

  const calculateAge = (dob?: string) => {
    if (!dob) return "";

    const birth = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();

    const month = today.getMonth() - birth.getMonth();

    if (
      month < 0 ||
      (month === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  return (
    <div className="min-h-screen bg-pink-50 py-10 px-4">

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">



        <div className="px-8 pb-8">

          <PublicProfileHeader
            profile={profile}
            calculateAge={calculateAge}
          />

          <div className="mt-8">

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-3">About Me</h2>

              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-gray-700 leading-7">
                  {profile.aboutMe || "This member has not added an About Me yet."}
                </p>
              </div>
            </div>

            <div className="mt-10 border-t pt-8">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <InfoCard label="Education" value={profile.education} />

                <InfoCard label="Occupation" value={profile.occupation} />

                <InfoCard label="Annual Salary" value={profile.annualSalary} />

                <InfoCard label="Height" value={profile.height} />

                <InfoCard label="Gender" value={profile.gender} />

                <InfoCard label="Caste" value={profile.caste} />

                <InfoCard label="City" value={profile.city} />

                <InfoCard label="Country" value={profile.country} />

              </div>
            </div>

          </div>

          <div className="mt-10 border-t pt-8">
            <h2 className="text-xl font-semibold mb-4">
              Family Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <InfoCard label="Father's Name" value={profile.fatherName} />

              <InfoCard label="Father's Occupation" value={profile.fatherOccupation} />

              <InfoCard label="Mother's Name" value={profile.motherName} />

              <InfoCard label="Mother's Occupation" value={profile.motherOccupation} />

              <InfoCard label="Family Type" value={profile.familyType} />

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}