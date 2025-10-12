"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Moon, Sun, Globe, Bell, Volume2, HelpCircle, LogOut } from "lucide-react"
import { useState } from "react"

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-neon-blue mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your experience</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="glass neon-glow-blue p-6 border-primary/20">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="cursor-pointer">
              <Avatar className="w-20 h-20 border-2 border-primary">
                <AvatarImage src="/diverse-user-avatars.png" />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="flex-1">
              <h3 className="font-heading text-xl font-bold mb-1">Alex Johnson</h3>
              <p className="text-sm text-muted-foreground mb-2">alex.johnson@email.com</p>
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Appearance Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="font-heading text-lg font-semibold mb-4">Appearance</h2>
        <Card className="glass p-4 border-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              <div>
                <Label htmlFor="dark-mode" className="font-semibold">
                  Dark Mode
                </Label>
                <p className="text-xs text-muted-foreground">Toggle dark theme</p>
              </div>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Language Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="font-heading text-lg font-semibold mb-4">Language</h2>
        <Card className="glass p-4 border-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-secondary" />
            <Label className="font-semibold">Learning Language</Label>
          </div>
          <Select defaultValue="en-us">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-us">🇺🇸 English (US)</SelectItem>
              <SelectItem value="en-gb">🇬🇧 English (UK)</SelectItem>
              <SelectItem value="es">🇪🇸 Spanish</SelectItem>
              <SelectItem value="fr">🇫🇷 French</SelectItem>
              <SelectItem value="de">🇩🇪 German</SelectItem>
              <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </motion.div>

      {/* Notifications Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <h2 className="font-heading text-lg font-semibold mb-4">Notifications</h2>
        <Card className="glass p-4 border-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <Label htmlFor="notifications" className="font-semibold">
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Daily reminders</p>
              </div>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
            </motion.div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-secondary" />
              <div>
                <Label htmlFor="sound" className="font-semibold">
                  Sound Effects
                </Label>
                <p className="text-xs text-muted-foreground">Audio feedback</p>
              </div>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Switch id="sound" checked={soundEffects} onCheckedChange={setSoundEffects} />
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Other Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <Button variant="outline" className="w-full justify-start gap-3 glass border-primary/10 bg-transparent">
          <HelpCircle className="w-5 h-5" />
          Help & Support
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 glass border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </motion.div>
    </div>
  )
}
