import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import ClientHeader from "../../components/agent/ClientHeader";
import Matches from "../../components/agent/Matches";
import Chat from "../../components/agent/Chat";
import History from "../../components/agent/History";
import NotificationPanel from "../../components/agent/NotificationPanel";
import SecondaryNavBar from "../../components/agent/SecondaryNavBar";
import { agentService } from "../../services/agent/agentService";
import { useAuthStore } from '../../store/authStore';


function SingleClientPage(){

const [activeTab,setActiveTab]=useState("matches");
const [notificationOpen,setNotificationOpen]=useState(false);

const userId = useAuthStore((s) => s.user?.id);

const loadNotifications = async () => {
  if (!userId) return;
  try {
    await agentService.getNotifications(userId);
    await agentService.getUnreadCount(userId);
  } catch (error) {
    console.error('Failed to pre-fetch notifications:', error);
    toast.error('Unable to load notifications.');
  }
};

useEffect(() => {
  if (userId) {
    void loadNotifications();
  }
}, [userId]);

return(

<div>


<ClientHeader
  
/>

<SecondaryNavBar
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  setNotificationOpen={setNotificationOpen}
/>

<div className="content">


{
activeTab==="matches" &&
<Matches/>
}



{
activeTab==="chat" &&
<Chat/>
}



{
activeTab==="history" &&
<History/>
}



</div>



{
notificationOpen &&

<NotificationPanel
  open={notificationOpen}
  onClose={()=>setNotificationOpen(false)}
/>

}


</div>

)


}


export default SingleClientPage;