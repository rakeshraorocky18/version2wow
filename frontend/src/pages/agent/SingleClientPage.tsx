import { useEffect, useState } from 'react';

import ClientHeader from "../../components/agent/ClientHeader";
import Matches from "../../components/agent/Matches";
import Chat from "../../components/agent/Chat";
import History from "../../components/agent/History";
import NotificationPanel from "../../components/agent/NotificationPanel";
import SecondaryNavBar from "../../components/agent/SecondaryNavBar";
import { agentService } from "../../services/agent/agentService";


function SingleClientPage(){

const [activeTab,setActiveTab]=useState("matches");
const [notificationOpen,setNotificationOpen]=useState(false);

const loadNotifications = async () => {
  const userId = "1"; // temporary
  await agentService.getNotifications(userId);
  await agentService.getUnreadCount(userId);
};

useEffect(() => {
  void loadNotifications();
}, []);

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