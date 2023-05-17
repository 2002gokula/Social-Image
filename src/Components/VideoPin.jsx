import {
  Flex,
  Image,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react"
import React, { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { gertUserInfo } from "../utils/fetchData"
import { Transaction, getDocs, getFirestore } from "firebase/firestore"
import { firebaseApp } from "../firebase-config"
import moment from "moment"
import firebase from "firebase/compat/app"
import { getDatabase, ref, onValue } from "firebase/database"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { logEvent } from "firebase/analytics"
import { getAnalytics } from "firebase/analytics"
const analytics = getAnalytics()
const avatar =
  "https://ak.picdn.net/contributors/3038285/avatars/thumb.jpg?t=164360626"

const VideoPin = ({ data }) => {
  const { colorMode } = useColorMode()
  const firestoreDb = getFirestore(firebaseApp)
  const linkRef = useRef(null)
  const bg = useColorModeValue("blackAlpha.700", "gray.900")
  const textColor = useColorModeValue("gray.100", "gray.100")

  const [userId, setUserId] = useState(null)
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    if (data) setUserId(data.userId)
    if (userId)
      gertUserInfo(firestoreDb, userId).then((data) => {
        setUserInfo(data)
      })
  }, [userId])

  const handleCopy = () => {
    // Copy the link to the clipboard
    navigator.clipboard.writeText(
      `http://localhost:3001/videoDetail/${data?.id}`
    )
  }

  const handleLinkClick = () => {
    // Track the click event using Firebase Analytics
    logEvent(analytics, "photo_link_clicked", {
      photoId: data?.id,
    })

    // Increment the views count in Firebase Realtime Database
    const db = getDatabase()
    const viewsRef = ref(db, `views/${data?.id}`)

    Transaction(viewsRef, (currentViews) => (currentViews || 0) + 1)
      .then(() => {
        console.log("Views count incremented successfully!")
      })
      .catch((error) => {
        console.error("Failed to increment views count:", error)
      })
  }

  const [analyticsData, setAnalyticsData] = useState([])
  const [viewsCount, setViewsCount] = useState(0)

  useEffect(() => {
    // Fetch analytics data for the photo owner
    const fetchAnalyticsData = () => {
      const db = getFirestore()
      const analyticsRef = collection(db, "analytics")
      const analyticsQuery = query(analyticsRef, where("userId", "==", userId))

      const unsubscribe = onSnapshot(analyticsQuery, (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data())
        setAnalyticsData(data)
      })

      return unsubscribe
    }

    const fetchViewsCount = () => {
      const db = getDatabase()
      const viewsRef = ref(db, "views")

      onValue(viewsRef, (snapshot) => {
        const viewsData = snapshot.val()
        const totalCount = viewsData
          ? Object.values(viewsData).reduce((total, count) => total + count, 0)
          : 0
        setViewsCount(totalCount)
      })
    }

    const unsubscribeAnalytics = fetchAnalyticsData()
    const unsubscribeViews = fetchViewsCount()

    return () => {
      // Unsubscribe from the snapshot listeners when the component unmounts
      unsubscribeAnalytics()
      // unsubscribeViews()
    }
  }, [userId])

  return (
    <Flex
      justifyContent={"space-between"}
      alignItems="center"
      direction={"column"}
      cursor="pointer"
      shadow={"lg"}
      _hover={{ shadow: "xl" }}
      rounded="md"
      overflow={"hidden"}
      position="relative"
      maxWidth={"300px"}
    >
      <Flex
        onClick={handleCopy}
        position="absolute"
        top="10px"
        background={"white"}
        rounded="full"
        left="10px"
        padding="7px"
        cursor={"pointer"}
      >
        <svg
          width={24}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            {" "}
            <path
              d="M9.61109 12.4L10.8183 18.5355C11.0462 19.6939 12.6026 19.9244 13.1565 18.8818L19.0211 7.84263C19.248 7.41555 19.2006 6.94354 18.9737 6.58417M9.61109 12.4L5.22642 8.15534C4.41653 7.37131 4.97155 6 6.09877 6H17.9135C18.3758 6 18.7568 6.24061 18.9737 6.58417M9.61109 12.4L18.9737 6.58417M19.0555 6.53333L18.9737 6.58417"
              stroke="#000000"
              stroke-width="2"
            ></path>{" "}
          </g>
        </svg>
      </Flex>

      <Link to={`/videoDetail/${data?.id}`} onClick={handleLinkClick}>
        <img src={data.videoUrl} />
      </Link>

      <Flex
        position={"absolute"}
        bottom="0"
        left="0"
        p={2}
        bg={bg}
        width="full"
        direction={"column"}
      >
        <Flex
          width={"full"}
          justifyContent="space-between"
          alignItems={"center"}
        >
          <Text color={textColor} isTruncated fontSize={20}>
            {data.title}
          </Text>

          <Link to={`/userDetail/${userId}`}>
            <Image
              src={userInfo?.photoURL ? userInfo?.photoURL : avatar}
              rounded="full"
              width={"50px"}
              height={"50px"}
              border="2px"
              borderColor={bg}
              mt={-10}
              minHeight="50px"
              minWidth={"50px"}
            />
          </Link>
        </Flex>
        <Text fontSize={12} color={textColor} ml="auto">
          {moment(new Date(parseInt(data.id)).toISOString()).fromNow()}
        </Text>
      </Flex>
      <Flex
        position="absolute"
        bottom="8px"
        left="10px"
        color="white"
        cursor={"pointer"}
        zIndex={9}
      >
        How Many clicks
        <div>
          <h3>Total Views: {viewsCount}</h3>
          <ul>
            {analyticsData.map((analyticsItem) => (
              <li key={analyticsItem.photoId}>
                Photo ID: {analyticsItem.photoId}, Clicks:{" "}
                {analyticsItem.clicks}, Views: {analyticsItem.views}
              </li>
            ))}
          </ul>
        </div>
      </Flex>
    </Flex>
  )
}

export default VideoPin
