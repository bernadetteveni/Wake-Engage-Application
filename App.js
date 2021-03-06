import React, { useState, useEffect, useRef } from 'react'
import { View, Platform, StyleSheet } from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import Games from './src/components/Games.js'
import AlarmList from './src/components/AlarmList.js'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
})

export default function App() {
  // If app opens naturally it will show the alarm component (GUI)
  const [pageId, setPageId] = useState('alarm') // alarm by default or games

  let gameFinished = () => {
    setPageId('alarm') // show alarm
  }

  //    NOTIFICATIONS START
  const [game, setGame] = useState('0') // '0' default
  // eslint-disable-next-line no-unused-vars
  const [expoPushToken, setExpoPushToken] = useState('')
  // eslint-disable-next-line no-unused-vars
  const [notification, setNotification] = useState(false)
  const notificationListener = useRef()
  const responseListener = useRef()

  // Runs every time its refreshed
  useEffect(() => {
    // Get token
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token))

    // Every time a notification is set this function is triggered (update notification)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification)
      })

    // Every time we receive a notification this function runs (app opens from notification and game runs)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          let alarms = await Notifications.getAllScheduledNotificationsAsync()
          await alarms.map(async (alarm) => {
            if (
              alarm.content.title ===
              response.notification.request.content.title
            ) {
              await Notifications.cancelScheduledNotificationAsync(
                alarm.identifier
              )
            }
          })
          // Set the game to play from the notification argument
          setGame(response.notification.request.content.data.game)
          // Start/Show the game
          setPageId('games')
        }
      )

    return () => {
      // Stop app from listening in the background
      Notifications.removeNotificationSubscription(notificationListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [])
  //    NOTIFICATIONS END

  return (
    <View style={styles.container}>
      {pageId === 'alarm' && <AlarmList />}

      {pageId === 'games' && (
        <Games onWinCondition={gameFinished} game={game} />
      )}
    </View>
  )
}

// Register with operating system to be allowed to send notifications
async function registerForPushNotificationsAsync() {
  let token
  // Check if using a physical device
  if (Constants.isDevice) {
    // Get user permission to run notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!')
      return
    }
    // If permission is granted, save token from notification
    token = (await Notifications.getExpoPushTokenAsync()).data
    // console.log(token)
  } else {
    // User is not on a physical device
    alert('Must use physical device for Push Notifications')
  }

  // If using Android, set preferences
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C'
    })
  }

  return token
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    width: 'auto',
    backgroundColor: 'black'
  }
})
