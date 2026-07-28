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
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (!profileId) return;

    const loadProfile = async () => {
      try {
    
        const data = await agentService.getPublicProfile(profileId);

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
            onImageClick={() => setShowImage(true)}
          />

          <div className="mt-8">

            {profile.aboutMe?.trim() && (
              <div className="mt-8">
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-gray-700 leading-7">
                    {profile.aboutMe}
                  </p>
                </div>
              </div>
            )}

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

        {showImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setShowImage(false)}
          >
            <img
              src={
                profile.profileImage
                  ? `http://localhost:3000${profile.profileImage}`
                  : "/default-avatar.png"
              }
              alt={profile.firstName}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl transition-transform duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              className="absolute top-5 right-8 text-white text-5xl"
              onClick={() => setShowImage(false)}
            >
              ×
            </button>
          </div>
        )}

      </div>

    </div>
  );
}