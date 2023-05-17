import {
  Box,
  Flex,
  Grid,
  GridItem,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useColorModeValue,
  Image,
  Popover,
  PopoverTrigger,
  Button,
  PopoverContent,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverFooter,
  ButtonGroup,
} from "@chakra-ui/react"
import { getFirestore } from "firebase/firestore"
import React, { useEffect, useRef, useState } from "react"
import { IoHome, IoPause, IoPlay, IoTrash } from "react-icons/io5"
import { FcApproval } from "react-icons/fc"

import ReactPlayer from "react-player"
import { Link, useNavigate, useParams } from "react-router-dom"

import Spinner from "../Components/Spinner"
import { firebaseApp } from "../firebase-config"
import {
  deleteVideo,
  gertUserInfo,
  getSpecificVideo,
  recommendedFeed,
} from "../utils/fetchData"
import logo from "../img/logo.png"
import screenfull from "screenfull"
import HTMLReactParser from "html-react-parser"
import moment from "moment"
import { fetchUser } from "../utils/fetchUser"
import RecommendedVideos from "./RecommendedVideos"

const format = (seconds) => {
  if (isNaN(seconds)) {
    return "00:00"
  }

  const date = new Date(seconds * 1000)
  const hh = date.getUTCHours()
  const mm = date.getUTCMinutes()
  const ss = date.getUTCSeconds().toString().padStart(2, "0")

  if (hh) {
    return `${hh}:${mm.toString().padStart(2, "0")} : ${ss}`
    // 01:02:32
  }

  return `${mm}:${ss}`
  // 02:35
}

const avatar =
  "https://ak.picdn.net/contributors/3038285/avatars/thumb.jpg?t=164360626"

const VideoPinDetail = () => {
  const { videoId } = useParams()
  const textColor = useColorModeValue("gray.900", "gray.50")
  const navigate = useNavigate()
  // firestore database instance
  const firestoreDb = getFirestore(firebaseApp)
  const [localUser] = fetchUser()

  const [isLoading, setIsLoading] = useState(false)
  const [imageInfo, setImageInfo] = useState(null)

  const [seeking, setSeeking] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [feeds, setFeeds] = useState(null)

  // Custom reference
  const playerRef = useRef()
  const playerContainer = useRef()

  useEffect(() => {
    if (videoId) {
      setIsLoading(true)
      getSpecificVideo(firestoreDb, videoId).then((data) => {
        setImageInfo(data)

        recommendedFeed(firestoreDb, data.category, videoId).then((feed) => {
          setFeeds(feed)
        })

        gertUserInfo(firestoreDb, data.userId).then((user) => {
          setUserInfo(user)
        })

        setIsLoading(false)
      })
    }
  }, [videoId])

  const currentTime = playerRef.current
    ? playerRef.current.getCurrentTime()
    : "00:00"

  const duration = playerRef.current ? playerRef.current.getDuration() : "00:00"

  const deleteTheVideo = (videoId) => {
    setIsLoading(true)
    deleteVideo(firestoreDb, videoId)
    navigate("/", { replace: true })
  }

  if (isLoading) return <Spinner />

  return (
    <Flex
      width={"full"}
      height="auto"
      justifyContent={"center"}
      alignItems="center"
      direction={"column"}
      py={2}
      px={4}
    >
      <Flex alignItems={"center"} width="full" my={4}>
        <Link to={"/"}>
          <IoHome fontSize={25} />
        </Link>
        <Box width="1px" height={"25px"} bg={"gray.500"} mx={2}></Box>
        <Text
          isTruncated
          color={textColor}
          fontWeight="semibold"
          width={"100%"}
        >
          {imageInfo?.title}
        </Text>
      </Flex>

      {/* Main Grid for video */}
      <Grid templateColumns="repeat(4, 1fr)" gap={2} width="100%">
        <GridItem width={"100%"} colSpan="3">
          <Flex
            width={"full"}
            bg="black"
            position="relative"
            ref={playerContainer}
          >
            <img src={imageInfo?.videoUrl} alt="" />
            {console.log("demo", imageInfo)}
          </Flex>

          {/* Video Description */}
          {imageInfo?.description && (
            <Flex my={6} direction="column">
              <Text my={2} fontSize={25} fontWeight="semibold">
                Description
              </Text>
              {HTMLReactParser(imageInfo?.description)}
            </Flex>
          )}
        </GridItem>
        <GridItem width={"100%"} colSpan="1">
          {userInfo && (
            <Flex direction={"column"} width={"full"}>
              <Flex alignItems={"center"} width="full">
                <Image
                  src={userInfo?.photoURL ? userInfo?.photoURL : avatar}
                  rounded="full"
                  width={"60px"}
                  height={"60px"}
                  minHeight="60px"
                  minWidth={"60px"}
                />

                <Flex direction={"column"} ml={3}>
                  <Flex alignItems={"center"}>
                    <Text isTruncated color={textColor} fontWeight="semibold">
                      {userInfo?.displayName}
                    </Text>
                    <FcApproval />
                  </Flex>
                  {imageInfo?.id && (
                    <Text fontSize={12}>
                      {moment(
                        new Date(parseInt(imageInfo.id)).toISOString()
                      ).fromNow()}
                    </Text>
                  )}
                </Flex>
              </Flex>

              {/* Ction Buttons */}
              <Flex justifyContent={"space-around"} mt={6}>
                {userInfo?.uid === localUser.uid && (
                  <Popover closeOnEsc>
                    <PopoverTrigger>
                      <Button colorScheme={"red"}>
                        <IoTrash fontSize={20} color="#fff" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverArrow />
                      <PopoverCloseButton />
                      <PopoverHeader>Confirmation!</PopoverHeader>
                      <PopoverBody>
                        Are you sure you want to delete it?
                      </PopoverBody>

                      <PopoverFooter d="flex" justifyContent="flex-end">
                        <ButtonGroup size="sm">
                          <Button
                            colorScheme="red"
                            onClick={() => deleteTheVideo(videoId)}
                          >
                            Yes
                          </Button>
                        </ButtonGroup>
                      </PopoverFooter>
                    </PopoverContent>
                  </Popover>
                )}

                <a
                  href={imageInfo.videoUrl}
                  download
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    colorScheme={"whatsapp"}
                    rounded="full"
                    my={2}
                    mt={"0"}
                  >
                    Free Download
                  </Button>
                </a>
              </Flex>
            </Flex>
          )}
        </GridItem>
      </Grid>

      {feeds && (
        <Flex direction={"column"} width="full" my={6}>
          <Text my={4} fontSize={25} fontWeight="semibold">
            Recommended Videos
          </Text>
          <RecommendedVideos feeds={feeds} />
        </Flex>
      )}
    </Flex>
  )
}

export default VideoPinDetail
