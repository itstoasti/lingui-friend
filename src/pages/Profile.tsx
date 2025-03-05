
import React from "react";
import Header from "@/components/Header";
import ProfileSettings from "@/components/ProfileSettings";
import { motion } from "framer-motion";

const Profile = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <motion.main 
        className="flex-1 pt-24 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container max-w-3xl">
          <ProfileSettings />
        </div>
      </motion.main>
    </div>
  );
};

export default Profile;
