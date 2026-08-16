import 'react-native-url-polyfill/auto';

import React, { useEffect, useState, useRef } from 'react';

import {
  AudioSession,
  LiveKitRoom,
  VideoTrack,
  isTrackReference,
  registerGlobals,
  useTracks,
} from '@livekit/react-native';

import { Track } from 'livekit-client';

registerGlobals();

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import {
  StripeProvider,
  useStripe,
} from '@stripe/stripe-react-native';

const supabaseUrl =
  'https://jvyiisvxvjiykqagffpq.supabase.co';

const supabaseKey =
  'sb_publishable_w-37jRWUXPYTEGLlrT89uw_Eh7EIu9K';

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

const API_URL =
  'https://stripe-payment-api--ETEletronic.replit.app';

const LIVEKIT_WS_URL =
  'wss://project-e-t-auctions-v8gsnc5i.livekit.cloud';

const LIVEKIT_ROOM_NAME =
  'et-auction-live';

const SELLER_CONNECTED_ACCOUNT_ID =
  'acct_1Ry4ywCnwPvtpnw6';

const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY';

const ORANGE = '#FF5B2A';
const BG = '#0B0D12';
const CARD = '#12161E';
const MUTED = '#929CAC';

function ETAuctionsApp() {
  const {
    initPaymentSheet,
    presentPaymentSheet,
  } = useStripe();

  const [page, setPage] =
    useState('Home');

  const [session, setSession] =
    useState(null);

  const [authEmail, setAuthEmail] =
    useState('');

  const [authPassword, setAuthPassword] =
    useState('');

  const [authLoading, setAuthLoading] =
    useState(true);

  const [
    liveKitToken,
    setLiveKitToken,
  ] = useState('');

  const [
    liveKitLoading,
    setLiveKitLoading,
  ] = useState(false);

  const [
    liveKitError,
    setLiveKitError,
  ] = useState('');

  const [products, setProducts] =
    useState([]);

  const [name, setName] =
    useState('');

  const [price, setPrice] =
    useState('');

  const [
    accountName,
    setAccountName,
  ] = useState('');

  const [
    accountEmail,
    setAccountEmail,
  ] = useState('');

  const [
    auctionProduct,
    setAuctionProduct,
  ] = useState(null);

  const [
    selectedAuctionId,
    setSelectedAuctionId,
  ] = useState(null);

  const [
    startingBid,
    setStartingBid,
  ] = useState('');

  const [
    currentBid,
    setCurrentBid,
  ] = useState(0);

  const [
    winningBidder,
    setWinningBidder,
  ] = useState('');

  const winningBidderRef =
    useRef('');

  const [
    auctionDuration,
    setAuctionDuration,
  ] = useState('60');

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [customBid, setCustomBid] =
    useState('');

  const [bidCount, setBidCount] =
    useState(0);

  const [chatMessage, setChatMessage] =
    useState('');

  const [liveMessages, setLiveMessages] =
    useState([
      { id: '1', name: 'techlover23', text: "This is fire 🔥" },
      { id: '2', name: 'bidupnow', text: "How's the sound?" },
      { id: '3', name: 'deals4days', text: "Let's go! 💪" },
    ]);

  const [
    completedAuctions,
    setCompletedAuctions,
  ] = useState([]);

  // =====================================
  // SUPABASE LOGIN
  // =====================================

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(
        ({
          data: { session },
        }) => {
          setSession(session);
          setAuthLoading(false);
        }
      );

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setAuthLoading(false);
        }
      );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // =====================================
  // LIVEKIT AUDIO SESSION
  // =====================================

  useEffect(() => {
    let mounted = true;

    async function startAudio() {
      try {
        await AudioSession.startAudioSession();
      } catch (error) {
        if (mounted) {
          console.log(
            'Could not start LiveKit audio:',
            error
          );
        }
      }
    }

    startAudio();

    return () => {
      mounted = false;

      AudioSession.stopAudioSession();
    };
  }, []);

  // =====================================
  // SIGN UP
  // =====================================

  async function signUp() {
    if (
      !authEmail ||
      !authPassword
    ) {
      Alert.alert(
        'Missing Information',
        'Enter your email and password.'
      );

      return;
    }

    const { error } =
      await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
      });

    if (error) {
      Alert.alert(
        'Sign Up Error',
        error.message
      );

      return;
    }

    Alert.alert(
      'Success',
      'Account created! Check your email if confirmation is required.'
    );
  }

  // =====================================
  // SIGN IN
  // =====================================

  async function signIn() {
    if (
      !authEmail ||
      !authPassword
    ) {
      Alert.alert(
        'Missing Information',
        'Enter your email and password.'
      );

      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

    if (error) {
      Alert.alert(
        'Login Error',
        error.message
      );
    }
  }

  // =====================================
  // SIGN OUT
  // =====================================

  async function signOut() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      Alert.alert(
        'Sign Out Error',
        error.message
      );
    }
  }

  // =====================================
  // LOAD COMPLETED AUCTIONS
  // =====================================

  useEffect(() => {
    const loadCompletedAuctions =
      async () => {
        try {
          const saved =
            await AsyncStorage.getItem(
              'et_completed_auctions'
            );

          if (saved) {
            setCompletedAuctions(
              JSON.parse(saved)
            );
          }
        } catch (error) {
          console.log(
            'Error loading completed auctions:',
            error
          );
        }
      };

    loadCompletedAuctions();
  }, []);

  // =====================================
  // AUCTION TIMER
  // =====================================

  useEffect(() => {
    if (!auctionProduct) {
      return;
    }

    const timer =
      setInterval(() => {
        setTimeLeft(
          (previousTime) => {
            if (
              previousTime <= 1
            ) {
              clearInterval(timer);

              setTimeout(() => {
                endAuction();
              }, 0);

              return 0;
            }

            return (
              previousTime - 1
            );
          }
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [auctionProduct]);

  // =====================================
  // LOAD PRODUCTS + ACCOUNT
  // =====================================

  useEffect(() => {
    loadProducts();
    loadAccount();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      'et_account_name',
      accountName
    );

    AsyncStorage.setItem(
      'et_account_email',
      accountEmail
    );
  }, [
    accountName,
    accountEmail,
  ]);

  async function loadAccount() {
    try {
      const savedName =
        await AsyncStorage.getItem(
          'et_account_name'
        );

      const savedEmail =
        await AsyncStorage.getItem(
          'et_account_email'
        );

      if (
        savedName !== null
      ) {
        setAccountName(
          savedName
        );
      }

      if (
        savedEmail !== null
      ) {
        setAccountEmail(
          savedEmail
        );
      }
    } catch (error) {
      console.log(
        'Could not load account'
      );
    }
  }

  async function loadProducts() {
    try {
      const savedProducts =
        await AsyncStorage.getItem(
          'et_products'
        );

      if (
        savedProducts !== null
      ) {
        setProducts(
          JSON.parse(
            savedProducts
          )
        );
      }
    } catch (error) {
      console.log(
        'Could not load products'
      );
    }
  }

  // =====================================
  // ADD PRODUCT
  // =====================================

  async function addProduct() {
    if (
      !name.trim() ||
      !price.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Enter a product name and price.'
      );

      return;
    }

    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice <= 0
    ) {
      Alert.alert(
        'Invalid Price',
        'Enter a valid product price.'
      );

      return;
    }

    const newProduct = {
      id: Date.now().toString(),
      name: name.trim(),
      price: numericPrice,
    };

    const newProducts = [
      ...products,
      newProduct,
    ];

    setProducts(
      newProducts
    );

    try {
      await AsyncStorage.setItem(
        'et_products',
        JSON.stringify(
          newProducts
        )
      );
    } catch (error) {
      console.log(
        'Could not save products'
      );
    }

    setName('');
    setPrice('');

    Alert.alert(
      'Product Added',
      'Your product is now ready for auction.'
    );
  }

  function chooseAuctionProduct(
    product
  ) {
    setSelectedAuctionId(
      product.id
    );

    setStartingBid('');
  }

  // =====================================
  // GET LIVEKIT TOKEN
  // =====================================

  async function getLiveKitToken({
    canPublish = false,
  } = {}) {
    if (
      !session?.user?.id
    ) {
      Alert.alert(
        'Live Video',
        'Please sign in first.'
      );

      return '';
    }

    try {
      setLiveKitLoading(true);
      setLiveKitError('');

      const response =
        await fetch(
          `${API_URL}/api/livekit-token`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                roomName:
                  LIVEKIT_ROOM_NAME,

                participantIdentity:
                  session.user.id,

                participantName:
                  accountName ||
                  session.user
                    .email ||
                  'E&T Auctions User',

                canPublish,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to create LiveKit token.'
        );
      }

      const token =
        data.participant_token ||
        data.token ||
        data.accessToken;

      if (!token) {
        throw new Error(
          'LiveKit token was not returned by the server.'
        );
      }

      setLiveKitToken(
        token
      );

      return token;
    } catch (error) {
      const message =
        error?.message ||
        'Unable to connect to live video.';

      setLiveKitError(
        message
      );

      Alert.alert(
        'Live Video Error',
        message
      );

      return '';
    } finally {
      setLiveKitLoading(
        false
      );
    }
  }

  // =====================================
  // START AUCTION
  // =====================================

  async function startAuction(
    product
  ) {
    const bid =
      Number(startingBid);

    if (
      !startingBid.trim() ||
      !Number.isFinite(bid) ||
      bid <= 0
    ) {
      Alert.alert(
        'Starting Bid',
        'Enter a valid starting bid.'
      );

      return;
    }

    const token =
      await getLiveKitToken({
        canPublish: true,
      });

    if (!token) {
      return;
    }

    setAuctionProduct(
      product
    );

    setCurrentBid(bid);

    setBidCount(0);

    setWinningBidder('');

    winningBidderRef.current =
      '';

    setTimeLeft(
      Number(
        auctionDuration
      )
    );

    setStartingBid('');

    setSelectedAuctionId(
      null
    );

    setPage('Live');

    Alert.alert(
      'Auction Started',
      `${product.name} is now live with a starting bid of $${bid.toFixed(
        2
      )}.`
    );
  }

  // =====================================
  // PLACE BID
  // =====================================

  function placeBid(amount) {
    if (!auctionProduct) {
      Alert.alert(
        'No Live Auction',
        'There is no auction running.'
      );

      return;
    }

    setCurrentBid(
      (previousBid) =>
        previousBid + amount
    );

    setBidCount(
      (previousCount) =>
        previousCount + 1
    );

    setWinningBidder(
      accountName ||
        'Account User'
    );

    winningBidderRef.current =
      accountName ||
      'Account User';
  }

  function sendLiveMessage() {
    const text = chatMessage.trim();

    if (!text) return;

    setLiveMessages((messages) => [
      ...messages,
      {
        id: `${Date.now()}`,
        name: accountName || 'Account User',
        text,
      },
    ]);

    setChatMessage('');
  }

  function placeCustomBid() {
    const amount =
      Number(customBid);

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      Alert.alert(
        'Invalid Bid',
        'Enter a valid bid amount.'
      );

      return;
    }

    placeBid(amount);

    setCustomBid('');
  }

  // =====================================
  // PAYMENT
  // =====================================

  async function handlePayment(
    amount
  ) {
    try {
      const response =
        await fetch(
          `${API_URL}/api/create-payment-intent`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                amount:
                  Math.round(
                    Number(
                      amount
                    ) * 100
                  ),

                currency:
                  'usd',

                connectedAccountId:
                  SELLER_CONNECTED_ACCOUNT_ID,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        Alert.alert(
          'Payment Error',
          data.error ||
            'Unable to create payment.'
        );

        return false;
      }

      const {
        error: initError,
      } =
        await initPaymentSheet({
          paymentIntentClientSecret:
            data.clientSecret,

          merchantDisplayName:
            'E&T Auctions',
        });

      if (initError) {
        Alert.alert(
          'Payment Error',
          initError.message
        );

        return false;
      }

      const {
        error: paymentError,
      } =
        await presentPaymentSheet();

      if (paymentError) {
        Alert.alert(
          'Payment Error',
          paymentError.message
        );

        return false;
      }

      Alert.alert(
        'Payment Successful',
        'Your payment was successful.'
      );

      return true;
    } catch (error) {
      Alert.alert(
        'Payment Error',
        error.message
      );

      return false;
    }
  }

  // =====================================
  // END AUCTION
  // =====================================

  async function endAuction() {
    if (!auctionProduct) {
      return;
    }

    if (
      winningBidderRef.current
    ) {
      const paymentSuccessful =
        await handlePayment(
          currentBid
        );

      if (
        !paymentSuccessful
      ) {
        return;
      }
    }

    const completedAuction = {
      name:
        auctionProduct.name,

      finalPrice:
        Number(currentBid),

      sellerFee:
        winningBidderRef.current
          ? Number(
              currentBid
            ) * 0.05
          : 0,

      sellerReceives:
        winningBidderRef.current
          ? Number(
              currentBid
            ) * 0.95
          : 0,

      winner:
        winningBidderRef.current ||
        'No bidder',

      paymentStatus:
        winningBidderRef.current
          ? 'Paid'
          : 'No payment required',

      sellerPayoutStatus:
        winningBidderRef.current
          ? 'Transferred'
          : 'No payout required',

      completedAt:
        new Date().toISOString(),
    };

    const updatedCompletedAuctions =
      [
        ...completedAuctions,
        completedAuction,
      ];

    setCompletedAuctions(
      updatedCompletedAuctions
    );

    await AsyncStorage.setItem(
      'et_completed_auctions',

      JSON.stringify(
        updatedCompletedAuctions
      )
    );

    Alert.alert(
      'Auction Ended',

      `${
        auctionProduct.name
      } ended at $${Number(
        currentBid
      ).toFixed(
        2
      )}.\nWinner: ${
        winningBidderRef.current ||
        'No bidder'
      }`
    );

    setAuctionProduct(
      null
    );

    setLiveKitToken('');

    setCurrentBid(0);

    setWinningBidder('');

    winningBidderRef.current =
      '';
  }

  // =====================================
  // HOME
  // =====================================

  function Home() {
    return (
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <Text
          style={styles.orange}
        >
          E&T ELECTRONICS
        </Text>

        <Text
          style={
            styles.bigTitle
          }
        >
          Bid live.{'\n'}
          Sell electronics.
        </Text>

        <Text
          style={
            styles.description
          }
        >
          Welcome to E&T
          Auctions, your live
          electronics marketplace.
        </Text>

        <TouchableOpacity
          style={
            styles.mainButton
          }
          onPress={() =>
            setPage('Live')
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            Join Live Auction
          </Text>
        </TouchableOpacity>

        <View
          style={styles.stats}
        >
          <View
            style={styles.stat}
          >
            <Text
              style={
                styles.statNumber
              }
            >
              {products.length}
            </Text>

            <Text
              style={
                styles.small
              }
            >
              Products
            </Text>
          </View>

          <View
            style={styles.stat}
          >
            <Text
              style={
                styles.statNumber
              }
            >
              5%
            </Text>

            <Text
              style={
                styles.small
              }
            >
              Seller Fee
            </Text>
          </View>

          <View
            style={styles.stat}
          >
            <Text
              style={
                styles.statNumber
              }
            >
              {auctionProduct
                ? 'LIVE'
                : 'OFF'}
            </Text>

            <Text
              style={
                styles.small
              }
            >
              Auction
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.heading
          }
        >
          Auction Items
        </Text>

        {products.length ===
        0 ? (
          <View
            style={styles.empty}
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              No products yet
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Your marketplace is
              ready for its first
              listing.
            </Text>
          </View>
        ) : (
          products
            .slice(0, 3)
            .map((item) => (
              <ProductCard
                key={item.id}
                item={item}
              />
            ))
        )}
      </ScrollView>
    );
  }

  // =====================================
  // LIVE SCREEN
  // =====================================

  function LiveScreen() {
    const nextBid = Number(currentBid) + 5;

    return (
      <ScrollView
        contentContainerStyle={styles.livePage}
        keyboardShouldPersistTaps="handled"
      >
        {!auctionProduct ? (
          <View style={styles.content}>
            <Text style={styles.orange}>● LIVE AUCTIONS</Text>
            <Text style={styles.title}>Auction Room</Text>
            <View style={styles.video}>
              <Text style={styles.camera}>🎥</Text>
              <Text style={styles.heading}>No auction live</Text>
              <Text style={styles.description}>
                When a seller starts an auction, it will appear here.
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.liveStage}>
              {liveKitLoading ? (
                <View style={styles.liveVideoFallback}>
                  <Text style={styles.camera}>🎥</Text>
                  <Text style={styles.description}>Connecting live camera...</Text>
                </View>
              ) : liveKitToken ? (
                <LiveKitRoom
                  serverUrl={LIVEKIT_WS_URL}
                  token={liveKitToken}
                  connect={true}
                  audio={true}
                  video={true}
                  options={{ adaptiveStream: { pixelDensity: 'screen' } }}
                >
                  <AuctionVideo />
                </LiveKitRoom>
              ) : (
                <View style={styles.liveVideoFallback}>
                  <Text style={styles.camera}>🎥</Text>
                  <Text style={styles.description}>
                    {liveKitError || 'Live video is not connected.'}
                  </Text>
                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() => getLiveKitToken({ canPublish: true })}
                  >
                    <Text style={styles.buttonText}>Connect Live Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.liveTopBar}>
                <View style={styles.sellerIdentity}>
                  <View style={styles.sellerAvatar}>
                    <Text style={styles.logoText}>E&T</Text>
                  </View>
                  <View>
                    <Text style={styles.sellerName}>E&T Electronics ✓</Text>
                    <Text style={styles.sellerHandle}>@et.auctions  ★ 4.9</Text>
                  </View>
                </View>
                <View style={styles.viewerPill}>
                  <Text style={styles.viewerText}>◉ 342</Text>
                </View>
                <View style={styles.liveRedBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              </View>

              <View style={styles.socialRail}>
                <Text style={styles.socialIcon}>♥</Text>
                <Text style={styles.socialCount}>128</Text>
                <Text style={styles.socialIcon}>●</Text>
                <Text style={styles.socialCount}>56</Text>
                <Text style={styles.socialIcon}>↗</Text>
                <Text style={styles.socialCount}>12</Text>
              </View>

              <View style={styles.chatOverlay}>
                {liveMessages.slice(-4).map((message) => (
                  <Text key={message.id} style={styles.chatLine}>
                    <Text style={styles.chatName}>{message.name}  </Text>
                    {message.text}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.productStrip}>
              <View style={styles.productThumb}>
                <Text style={styles.productEmoji}>🎧</Text>
              </View>
              <View style={styles.productStripText}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {auctionProduct.name}
                </Text>
                <Text style={styles.productSubtitle}>Wireless electronics • E&T Guarantee</Text>
                <Text style={styles.shippingText}>⚡ Fast Shipping</Text>
              </View>
              <TouchableOpacity style={styles.detailsPill}>
                <Text style={styles.detailsText}>Details⌃</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.auctionPanel}>
              <View style={styles.bidSummary}>
                <View style={styles.bidSummaryColumn}>
                  <Text style={styles.small}>CURRENT BID</Text>
                  <Text style={styles.currentBidText}>$${Number(currentBid).toFixed(0)}</Text>
                  <Text style={styles.winnerText}>
                    by {winningBidder || 'Waiting for first bidder'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.bidSummaryColumn}>
                  <Text style={styles.small}>TIME LEFT</Text>
                  <Text style={styles.timerText}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </Text>
                  <Text style={styles.bidCountText}>{bidCount} bids</Text>
                </View>
              </View>

              <View style={styles.bidRow}>
                {[5, 10, 25, 50].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickBid}
                    onPress={() => placeBid(amount)}
                  >
                    <Text style={styles.quickBidText}>+ $ {amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.heroBidButton}
                onPress={() => placeBid(5)}
              >
                <Text style={styles.heroBidText}>BID $ {nextBid.toFixed(0)}</Text>
                <Text style={styles.incrementText}>Bid increments: $5</Text>
              </TouchableOpacity>

              <View style={styles.chatComposer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Say something..."
                  placeholderTextColor="#707782"
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  onSubmitEditing={sendLiveMessage}
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendLiveMessage}>
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.endButton} onPress={endAuction}>
                <Text style={styles.endButtonText}>End Auction</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  // =====================================

  // SELL SCREEN
  // =====================================

  function Sell() {
    return (
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <Text
          style={styles.orange}
        >
          SELLER CENTER
        </Text>

        <Text
          style={styles.title}
        >
          Start Selling
        </Text>

        <View
          style={styles.feeBox}
        >
          <Text
            style={
              styles.feeNumber
            }
          >
            5%
          </Text>

          <View
            style={
              styles.feeText
            }
          >
            <Text
              style={
                styles.feeTitle
              }
            >
              Marketplace Fee
            </Text>

            <Text
              style={
                styles.small
              }
            >
              E&T receives 5% of
              marketplace sales
            </Text>
          </View>
        </View>

        <View
          style={styles.card}
        >
          <Text
            style={
              styles.heading
            }
          >
            Add Product
          </Text>

          <Text
            style={styles.label}
          >
            PRODUCT NAME
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Example: Wireless Headphones"
            placeholderTextColor="#626B78"
            value={name}
            onChangeText={
              setName
            }
          />

          <Text
            style={styles.label}
          >
            PRICE
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="$0.00"
            placeholderTextColor="#626B78"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={
              setPrice
            }
          />

          <TouchableOpacity
            style={
              styles.mainButton
            }
            onPress={addProduct}
          >
            <Text
              style={
                styles.buttonText
              }
            >
              Add Product
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={
            styles.heading
          }
        >
          Your Inventory
        </Text>

        {products.length ===
        0 ? (
          <Text
            style={
              styles.description
            }
          >
            No products added yet.
          </Text>
        ) : (
          products.map(
            (item) => (
              <View
                key={item.id}
                style={
                  styles.card
                }
              >
                <Text
                  style={
                    styles.productName
                  }
                >
                  {item.name}
                </Text>

                <Text
                  style={
                    styles.productPrice
                  }
                >
                  $
                  {Number(
                    item.price
                  ).toFixed(2)}
                </Text>

                {auctionProduct?.id ===
                  item.id && (
                  <Text
                    style={
                      styles.liveProduct
                    }
                  >
                    ● CURRENTLY LIVE
                  </Text>
                )}

                <Text
                  style={
                    styles.label
                  }
                >
                  AUCTION LENGTH
                </Text>

                <View
                  style={
                    styles.bidRow
                  }
                >
                  {[
                    {
                      label:
                        '1 Min',
                      seconds:
                        '60',
                    },
                    {
                      label:
                        '5 Min',
                      seconds:
                        '300',
                    },
                    {
                      label:
                        '10 Min',
                      seconds:
                        '600',
                    },
                    {
                      label:
                        '30 Min',
                      seconds:
                        '1800',
                    },
                    {
                      label:
                        '1 Hour',
                      seconds:
                        '3600',
                    },
                  ].map(
                    (
                      option
                    ) => (
                      <TouchableOpacity
                        key={
                          option.seconds
                        }
                        style={[
                          styles.bidButton,

                          auctionDuration ===
                            option.seconds && {
                            borderWidth: 2,
                            borderColor:
                              'white',
                          },
                        ]}
                        onPress={() =>
                          setAuctionDuration(
                            option.seconds
                          )
                        }
                      >
                        <Text
                          style={
                            styles.buttonText
                          }
                        >
                          {
                            option.label
                          }
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Text
                  style={
                    styles.label
                  }
                >
                  STARTING BID
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="$0.00"
                  placeholderTextColor="#626B78"
                  keyboardType="decimal-pad"
                  value={
                    selectedAuctionId ===
                    item.id
                      ? startingBid
                      : ''
                  }
                  onFocus={() =>
                    chooseAuctionProduct(
                      item
                    )
                  }
                  onChangeText={(
                    text
                  ) => {
                    setSelectedAuctionId(
                      item.id
                    );

                    setStartingBid(
                      text
                    );
                  }}
                />

                <TouchableOpacity
                  style={
                    styles.mainButton
                  }
                  onPress={() =>
                    startAuction(
                      item
                    )
                  }
                >
                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Start Auction
                  </Text>
                </TouchableOpacity>
              </View>
            )
          )
        )}
      </ScrollView>
    );
  }

  // =====================================
  // ACCOUNT SCREEN
  // =====================================

  const Account = () => {
    return (
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <Text
          style={styles.orange}
        >
          ACCOUNT
        </Text>

        <Text
          style={styles.title}
        >
          My Account
        </Text>

        <Text
          style={styles.label}
        >
          ACCOUNT NAME
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#626B78"
          value={accountName}
          onChangeText={
            setAccountName
          }
        />

        <Text
          style={styles.label}
        >
          EMAIL
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#626B78"
          keyboardType="email-address"
          autoCapitalize="none"
          value={accountEmail}
          onChangeText={(
            text
          ) => {
            setAccountEmail(
              text
            );

            AsyncStorage.setItem(
              'et_account_email',
              text
            );
          }}
        />

        <View
          style={styles.card}
        >
          <View
            style={
              styles.accountLogo
            }
          >
            <Text
              style={
                styles.accountLogoText
              }
            >
              E&T
            </Text>
          </View>

          <Text
            style={
              styles.heading
            }
          >
            E&T Electronics
          </Text>

          <Text
            style={
              styles.description
            }
          >
            Marketplace Owner
          </Text>
        </View>

        <View
          style={styles.card}
        >
          <Text
            style={
              styles.heading
            }
          >
            Marketplace Settings
          </Text>

          <View
            style={
              styles.setting
            }
          >
            <Text
              style={
                styles.description
              }
            >
              Seller Fee
            </Text>

            <Text
              style={
                styles.settingValue
              }
            >
              5%
            </Text>
          </View>

          <View
            style={
              styles.setting
            }
          >
            <Text
              style={
                styles.description
              }
            >
              Products
            </Text>

            <Text
              style={
                styles.settingValue
              }
            >
              {products.length}
            </Text>
          </View>

          <View
            style={
              styles.setting
            }
          >
            <Text
              style={
                styles.description
              }
            >
              Auction Status
            </Text>

            <Text
              style={
                styles.settingValue
              }
            >
              {auctionProduct
                ? 'Live'
                : 'Offline'}
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.heading
          }
        >
          Completed Auctions
        </Text>

        {completedAuctions.length ===
        0 ? (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.description
              }
            >
              No completed auctions
              yet.
            </Text>
          </View>
        ) : (
          completedAuctions.map(
            (
              auction,
              index
            ) => (
              <View
                style={
                  styles.card
                }
                key={index}
              >
                <Text
                  style={
                    styles.heading
                  }
                >
                  {
                    auction.name
                  }
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Final Price: $
                  {Number(
                    auction.finalPrice
                  ).toFixed(2)}
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Winner:{' '}
                  {
                    auction.winner
                  }
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Payment:{' '}
                  {auction.paymentStatus ||
                    'Unknown'}
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Seller Payout:{' '}
                  {auction.sellerPayoutStatus ||
                    'Unknown'}
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  E&T Fee (5%): $
                  {Number(
                    auction.sellerFee ||
                      0
                  ).toFixed(2)}
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Seller Receives: $
                  {Number(
                    auction.sellerReceives ||
                      0
                  ).toFixed(2)}
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Completed:{' '}
                  {new Date(
                    auction.completedAt
                  ).toLocaleString()}
                </Text>
              </View>
            )
          )
        )}

        <TouchableOpacity
          style={
            styles.endButton
          }
          onPress={signOut}
        >
          <Text
            style={
              styles.endButtonText
            }
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // =====================================
  // SCREEN NAVIGATION
  // =====================================

  function Screen() {
    if (
      page === 'Live'
    ) {
      return <LiveScreen />;
    }

    if (
      page === 'Sell'
    ) {
      return <Sell />;
    }

    if (
      page === 'Account'
    ) {
      return <Account />;
    }

    return <Home />;
  }

  // =====================================
  // LOADING
  // =====================================

  if (authLoading) {
    return (
      <SafeAreaView
        style={styles.app}
      >
        <View
          style={{
            flex: 1,
            justifyContent:
              'center',
            padding: 24,
          }}
        >
          <Text
            style={
              styles.title
            }
          >
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================
  // LOGIN PAGE
  // =====================================

  if (!session) {
    return (
      <SafeAreaView
        style={styles.app}
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
        >
          <Text
            style={
              styles.orange
            }
          >
            E&T ELECTRONICS
          </Text>

          <Text
            style={
              styles.bigTitle
            }
          >
            E&T Auctions
          </Text>

          <Text
            style={
              styles.description
            }
          >
            Sign in or create an
            account to continue.
          </Text>

          <Text
            style={
              styles.label
            }
          >
            EMAIL
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Enter your email"
            placeholderTextColor="#626B78"
            keyboardType="email-address"
            autoCapitalize="none"
            value={authEmail}
            onChangeText={
              setAuthEmail
            }
          />

          <Text
            style={
              styles.label
            }
          >
            PASSWORD
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Enter your password"
            placeholderTextColor="#626B78"
            secureTextEntry
            value={
              authPassword
            }
            onChangeText={
              setAuthPassword
            }
          />

          <TouchableOpacity
            style={
              styles.mainButton
            }
            onPress={signIn}
          >
            <Text
              style={
                styles.buttonText
              }
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.endButton
            }
            onPress={signUp}
          >
            <Text
              style={
                styles.endButtonText
              }
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================
  // MAIN APP
  // =====================================

  return (
    <SafeAreaView
      style={styles.app}
    >
      {!(page === 'Live' && auctionProduct) && (
      <View
        style={styles.header}
      >
        <View
          style={styles.logo}
        >
          <Text
            style={
              styles.logoText
            }
          >
            E&T
          </Text>
        </View>

        <View>
          <Text
            style={
              styles.brand
            }
          >
            E&T Auctions
          </Text>

          <Text
            style={
              styles.small
            }
          >
            ELECTRONICS
            MARKETPLACE
          </Text>
        </View>
      </View>
      )}

      <View
        style={styles.screen}
      >
        {Screen()}
      </View>

      <View
        style={styles.nav}
      >
        {[
          'Home',
          'Live',
          'Sell',
          'Account',
        ].map((item) => (
          <TouchableOpacity
            key={item}
            style={
              styles.navItem
            }
            onPress={() =>
              setPage(item)
            }
          >
            <Text
              style={[
                styles.navText,

                page === item &&
                  styles.navSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.etelectronics.auctions"
    >
      <ETAuctionsApp />
    </StripeProvider>
  );
}

// =====================================
// LIVE VIDEO COMPONENT
// =====================================

function AuctionVideo() {
  const tracks =
    useTracks([
      Track.Source.Camera,
    ]);

  const cameraTrack =
    tracks.find(
      (track) =>
        isTrackReference(
          track
        )
    );

  if (!cameraTrack) {
    return (
      <View
        style={styles.video}
      >
        <Text
          style={styles.camera}
        >
          🎥
        </Text>

        <Text
          style={
            styles.description
          }
        >
          Waiting for camera
          video...
        </Text>
      </View>
    );
  }

  return (
    <VideoTrack
      trackRef={
        cameraTrack
      }
      style={
        styles.liveVideo
      }
    />
  );
}

// =====================================
// PRODUCT CARD
// =====================================

function ProductCard({
  item,
}) {
  return (
    <View
      style={styles.product}
    >
      <View
        style={
          styles.productImage
        }
      >
        <Text
          style={
            styles.productImageText
          }
        >
          ELECTRONICS
        </Text>
      </View>

      <View
        style={
          styles.productInfo
        }
      >
        <Text
          style={
            styles.productName
          }
        >
          {item.name}
        </Text>

        <Text
          style={
            styles.productPrice
          }
        >
          $
          {Number(
            item.price
          ).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

// =====================================
// STYLES
// =====================================

const styles =
  StyleSheet.create({
    app: {
      flex: 1,
      backgroundColor: BG,
    },

    screen: {
      flex: 1,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor:
        '#242B36',
    },

    logo: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        ORANGE,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    logoText: {
      color: 'white',
      fontWeight: '900',
    },

    brand: {
      color: 'white',
      fontSize: 17,
      fontWeight: '900',
    },

    content: {
      padding: 18,
      paddingBottom: 40,
    },

    orange: {
      color: ORANGE,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.3,
      marginBottom: 8,
    },

    bigTitle: {
      color: 'white',
      fontSize: 45,
      lineHeight: 48,
      fontWeight: '900',
    },

    title: {
      color: 'white',
      fontSize: 35,
      fontWeight: '900',
      marginBottom: 15,
    },

    heading: {
      color: 'white',
      fontSize: 22,
      fontWeight: '800',
      marginVertical: 12,
    },

    description: {
      color: MUTED,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 15,
    },

    small: {
      color: MUTED,
      fontSize: 10,
      fontWeight: '700',
    },

    mainButton: {
      backgroundColor:
        ORANGE,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
    },

    buttonText: {
      color: 'white',
      fontWeight: '900',
    },

    stats: {
      flexDirection: 'row',
      gap: 8,
      marginVertical: 20,
    },

    stat: {
      flex: 1,
      backgroundColor:
        CARD,
      borderRadius: 15,
      padding: 13,
    },

    statNumber: {
      color: 'white',
      fontSize: 20,
      fontWeight: '900',
    },

    card: {
      backgroundColor:
        CARD,
      borderRadius: 20,
      padding: 18,
      marginBottom: 15,
    },

    empty: {
      backgroundColor:
        CARD,
      padding: 25,
      borderRadius: 20,
      alignItems: 'center',
    },

    emptyTitle: {
      color: 'white',
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 8,
    },

    video: {
      minHeight: 180,
      backgroundColor:
        '#121924',
      borderRadius: 22,
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 25,
      marginBottom: 15,
    },

    liveVideoContainer: {
      backgroundColor:
        '#121924',
      borderRadius: 22,
      overflow: 'hidden',
      marginBottom: 15,
    },

    liveVideo: {
      width: '100%',
      height: 430,
      backgroundColor:
        '#000000',
    },

    livePage: {
      paddingBottom: 28,
      backgroundColor: '#050607',
    },

    liveStage: {
      height: 430,
      backgroundColor: '#050607',
      overflow: 'hidden',
      position: 'relative',
    },

    liveVideoFallback: {
      width: '100%',
      height: 430,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
      backgroundColor: '#121924',
    },

    liveTopBar: {
      position: 'absolute',
      top: 15,
      left: 14,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    sellerIdentity: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },

    sellerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: ORANGE,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 9,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },

    sellerName: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
      textShadowColor: '#000000',
      textShadowRadius: 5,
    },

    sellerHandle: {
      color: '#E2E5EA',
      fontSize: 11,
      marginTop: 2,
      textShadowColor: '#000000',
      textShadowRadius: 5,
    },

    viewerPill: {
      backgroundColor: 'rgba(10,16,27,0.88)',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },

    viewerText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },

    liveRedBadge: {
      backgroundColor: '#EF233C',
      borderRadius: 8,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },

    socialRail: {
      position: 'absolute',
      right: 14,
      top: 110,
      alignItems: 'center',
    },

    socialIcon: {
      color: '#FFFFFF',
      fontSize: 27,
      fontWeight: '900',
      marginTop: 10,
      textShadowColor: '#000000',
      textShadowRadius: 5,
    },

    socialCount: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
      textShadowColor: '#000000',
      textShadowRadius: 5,
    },

    chatOverlay: {
      position: 'absolute',
      left: 14,
      right: 70,
      bottom: 15,
    },

    chatLine: {
      alignSelf: 'flex-start',
      color: '#FFFFFF',
      fontSize: 13,
      backgroundColor: 'rgba(0,0,0,0.44)',
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 6,
      marginTop: 5,
    },

    chatName: {
      color: '#C8CED8',
      fontWeight: '900',
    },

    productStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 108,
      backgroundColor: '#101316',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#2B3036',
      padding: 12,
    },

    productThumb: {
      width: 86,
      height: 78,
      borderRadius: 11,
      backgroundColor: '#252A2F',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    productEmoji: { fontSize: 42 },

    productStripText: { flex: 1 },

    productTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
    },

    productSubtitle: {
      color: '#A6ADB6',
      fontSize: 11,
      marginTop: 5,
    },

    shippingText: {
      color: ORANGE,
      fontSize: 11,
      fontWeight: '900',
      marginTop: 7,
    },

    detailsPill: {
      backgroundColor: '#23272C',
      borderRadius: 11,
      paddingHorizontal: 10,
      paddingVertical: 12,
    },

    detailsText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '900',
    },

    auctionPanel: {
      backgroundColor: '#0D0F11',
      padding: 14,
    },

    bidSummary: {
      flexDirection: 'row',
      backgroundColor: '#111417',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#252A2F',
      paddingVertical: 14,
      marginBottom: 12,
    },

    bidSummaryColumn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    divider: {
      width: 1,
      backgroundColor: '#2A2F35',
    },

    currentBidText: {
      color: '#FFFFFF',
      fontSize: 37,
      fontWeight: '900',
      marginVertical: 3,
    },

    timerText: {
      color: ORANGE,
      fontSize: 37,
      fontWeight: '900',
      marginVertical: 3,
    },

    winnerText: {
      color: ORANGE,
      fontSize: 11,
      fontWeight: '800',
    },

    bidCountText: {
      color: '#A6ADB6',
      fontSize: 11,
    },

    quickBid: {
      flex: 1,
      minWidth: 65,
      backgroundColor: '#23272A',
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
    },

    quickBidText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
    },

    heroBidButton: {
      backgroundColor: ORANGE,
      minHeight: 88,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },

    heroBidText: {
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: '900',
    },

    incrementText: {
      color: '#FFD8CA',
      fontSize: 11,
      marginTop: 3,
    },

    chatComposer: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 8,
    },

    chatInput: {
      flex: 1,
      color: '#FFFFFF',
      backgroundColor: '#181C20',
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 11,
    },

    sendButton: {
      backgroundColor: '#272C31',
      borderRadius: 20,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },

    sendButtonText: {
      color: '#FFFFFF',
      fontWeight: '900',
    },

    camera: {
      fontSize: 45,
    },

    liveBadge: {
      alignSelf:
        'flex-start',
      backgroundColor:
        ORANGE,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      marginBottom: 10,
    },

    liveBadgeText: {
      color: 'white',
      fontSize: 11,
      fontWeight: '900',
    },

    bid: {
      color: 'white',
      fontSize: 48,
      fontWeight: '900',
      marginVertical: 8,
    },

    bidRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },

    bidButton: {
      flex: 1,
      minWidth: 60,
      backgroundColor:
        ORANGE,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
    },

    endButton: {
      borderWidth: 1,
      borderColor:
        '#D94A4A',
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 15,
    },

    endButtonText: {
      color: '#FF6868',
      fontWeight: '900',
    },

    feeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        CARD,
      borderRadius: 18,
      padding: 18,
      marginBottom: 15,
    },

    feeNumber: {
      color: ORANGE,
      fontSize: 35,
      fontWeight: '900',
      marginRight: 18,
    },

    feeText: {
      flex: 1,
    },

    feeTitle: {
      color: 'white',
      fontWeight: '800',
    },

    label: {
      color: MUTED,
      fontSize: 10,
      fontWeight: '900',
      marginTop: 12,
      marginBottom: 6,
    },

    input: {
      backgroundColor: BG,
      color: 'white',
      padding: 14,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        '#29313E',
    },

    product: {
      backgroundColor:
        CARD,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 12,
    },

    productImage: {
      height: 110,
      backgroundColor:
        '#17202C',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    productImageText: {
      color: '#4B5B73',
      fontWeight: '900',
    },

    productInfo: {
      padding: 15,
    },

    productName: {
      color: 'white',
      fontSize: 17,
      fontWeight: '800',
    },

    productPrice: {
      color: 'white',
      fontSize: 21,
      fontWeight: '900',
      marginTop: 7,
    },

    liveProduct: {
      color: ORANGE,
      fontSize: 11,
      fontWeight: '900',
      marginTop: 10,
    },

    accountLogo: {
      width: 70,
      height: 70,
      borderRadius: 20,
      backgroundColor:
        ORANGE,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    accountLogoText: {
      color: 'white',
      fontSize: 22,
      fontWeight: '900',
    },

    setting: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginBottom: 8,
    },

    settingValue: {
      color: 'white',
      fontWeight: '900',
    },

    nav: {
      height: 65,
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor:
        '#242B36',
      backgroundColor:
        '#0D1016',
    },

    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    navText: {
      color: MUTED,
      fontSize: 11,
      fontWeight: '700',
    },

    navSelected: {
      color: ORANGE,
    },
  });
