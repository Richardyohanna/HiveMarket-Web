import greenOverlay from "../assets/green-overlay.png";
import homeMobile from "../assets/home-mobile.png";
import shopMobile from "../assets/shop-mobile.png";
import androidIcon from "../assets/android-icon.png";
import iosIcon from "../assets/ios-icon.png";

import { motion, useReducedMotion } from "framer-motion";

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-white"
    >
      {/* =========================================================
          Decorative Background
      ========================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
        }}
        animate={{
          opacity: 0.5,
          scale: shouldReduceMotion ? 1 : [1, 1.03, 1],
        }}
        transition={{
          opacity: {
            duration: 1,
            ease: "easeOut",
          },
          scale: shouldReduceMotion
            ? {
                duration: 0,
              }
            : {
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              },
        }}
        className="
          pointer-events-none
          absolute
          -right-55
          -bottom-74
          h-[760px]
          w-[780px]
          overflow-hidden
          rounded-full
          lg:block
          sm:hidden
          hidden
        "
      >
        <img
          src={greenOverlay}
          alt=""
          className="h-full w-full object-cover"
        />
      </motion.div>

      {/* =========================================================
          Floating Background Bubbles
      ========================================================== */}

      {!shouldReduceMotion && (
        <>
          {/* Bubble 1 */}
          <motion.div
            className="
              pointer-events-none
              absolute
              left-[8%]
              top-[20%]
              h-3
              w-3
              rounded-full
              bg-[#008100]/10
              blur-[1px]
            "
            animate={{
              y: [0, -18, 0],
              x: [0, 8, 0],
              opacity: [0.35, 0.7, 0.35],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Bubble 2 */}
          <motion.div
            className="
              pointer-events-none
              absolute
              left-[44%]
              top-[13%]
              h-5
              w-5
              rounded-full
              bg-[#008100]/[0.07]
            "
            animate={{
              y: [0, 20, 0],
              x: [0, -12, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Bubble 3 */}
          <motion.div
            className="
              pointer-events-none
              absolute
              right-[42%]
              bottom-[18%]
              h-3
              w-3
              rounded-full
              bg-[#008100]/10
            "
            animate={{
              y: [0, -25, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Bubble 4 */}
          <motion.div
            className="
              pointer-events-none
              absolute
              right-[8%]
              top-[28%]
              h-2
              w-2
              rounded-full
              bg-[#008100]/15
            "
            animate={{
              y: [0, 15, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </>
      )}

      {/* =========================================================
          Main Hero Container
      ========================================================== */}

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">

        {/* =======================================================
            Left Side
        ======================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            x: -35,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10 max-w-xl"
        >
          {/* Heading */}

          <motion.h1
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              text-4xl
              font-extrabold
              leading-[1.08]
              tracking-[-1.5px]
              text-[#17191c]
              sm:text-5xl
              lg:text-[54px]
            "
          >
            Community Shopping,
            <span className="block text-[#008100]">
              Simplified.
            </span>
          </motion.h1>

          {/* Description */}

          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.65,
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              mt-6
              max-w-lg
              text-[15px]
              leading-7
              text-[#4b5158]
              sm:text-base
            "
          >
            HiveMarket connects you with trusted shops around
            your community. Discover products, connect with shop
            owners, and shop smarter.
          </motion.p>

          {/* =====================================================
              Download Buttons
          ====================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.65,
              delay: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            {/* Android */}

            <motion.a
              href="#download"
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -3,
                      scale: 1.02,
                      boxShadow: "0 10px 25px rgba(0,129,0,0.18)",
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.97,
                    }
              }
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
              }}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-md
                bg-[#008100]
                px-5
                py-3
                text-sm
                font-semibold
                text-white!
                shadow-sm
                transition-colors
                duration-200
                hover:bg-[#006d24]
              "
            >
              <img
                src={androidIcon}
                alt="Android icon"
              />

              Download for Android
            </motion.a>

            {/* iOS */}

            <motion.a
              href="#download"
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -3,
                      scale: 1.02,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.97,
                    }
              }
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
              }}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-md
                border
                border-gray-300
                bg-white
                px-5
                py-3
                text-sm
                font-semibold
                text-[#17191c]
                transition-colors
                duration-200
                hover:border-[#008100]
                hover:text-[#008100]
              "
            >
              <img
                src={iosIcon}
                alt="iOS icon"
              />

              Download on iOS
            </motion.a>
          </motion.div>

          {/* =====================================================
              Social Proof
          ====================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-9 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {["Y", "A", "R", "J", "M"].map(
                (letter, index) => (
                  <motion.div
                    key={index}
                    initial={{
                      opacity: 0,
                      scale: 0.5,
                      x: -8,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: 0,
                    }}
                    transition={{
                      duration: 0.35,
                      delay: 0.65 + index * 0.07,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : {
                            y: -4,
                            scale: 1.12,
                            zIndex: 10,
                          }
                    }
                    className="
                      relative
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      border-2
                      border-white
                      bg-[#dce9df]
                      text-[10px]
                      font-bold
                      text-[#315b3d]
                      shadow-sm
                    "
                  >
                    {letter}
                  </motion.div>
                )
              )}
            </div>

            <p className="max-w-[240px] text-xs leading-5 text-gray-500">
              Join thousands of students already using
              HiveMarket on campus.
            </p>
          </motion.div>
        </motion.div>

        {/* =======================================================
            Right Side — Phones
        ======================================================== */}

        <div
          className="
            relative
            min-h-[420px]
            items-center
            justify-center
            lg:min-h-[500px]
            lg:flex
            md:flex
            sm:hidden
            hidden
          "
        >
          {/* =====================================================
              Back Phone
          ====================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: 50,
              y: 20,
              rotate: 13,
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: shouldReduceMotion ? 0 : [0, -10, 0],
              rotate: 9,
            }}
            transition={{
              opacity: {
                duration: 0.8,
                delay: 0.25,
              },
              x: {
                duration: 0.9,
                delay: 0.25,
                ease: [0.22, 1, 0.36, 1],
              },
              rotate: {
                duration: 0.9,
                delay: 0.25,
                ease: [0.22, 1, 0.36, 1],
              },
              y: shouldReduceMotion
                ? {
                    duration: 0,
                  }
                : {
                    duration: 5,
                    repeat: 0,
                    ease: "easeInOut",
                  },
            }}
            className="
              absolute
              right-[8%]
              top-1/2
              h-[539.16px]
              w-[246.39px]
              -translate-y-1/2
              rotate-[9deg]
            "
          >
            <img
              src={shopMobile}
              alt="HiveMarket shop screen"
              className="
                h-[500px]
                translate-y-4
                drop-shadow-[0_28px_30px_rgba(0,0,0,0.22)]
              "
            />
          </motion.div>

          {/* =====================================================
              Main Phone
          ====================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: -20,
              y: 35,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              x: -40,
              y: shouldReduceMotion
                ? -20
                : [-20, -27, -20],
              scale: 1,
            }}
            transition={{
              opacity: {
                duration: 0.8,
                delay: 0.15,
              },
              x: {
                duration: 0.9,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              },
              scale: {
                duration: 0.9,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              },
              y: shouldReduceMotion
                ? {
                    duration: 0.9,
                    delay: 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }
                : {
                    duration: 4.5,
                    repeat: 0,
                    ease: "easeInOut",
                  },
            }}
            className="
              relative
              z-10
              h-[539.16px]
              w-[256.39px]
            "
          >
            {/* Ground Shadow */}

            <motion.div
              animate={
                shouldReduceMotion
                  ? {
                      opacity: 0.25,
                      scale: 1,
                    }
                  : {
                      opacity: [0.2, 0.3, 0.2],
                      scale: [0.95, 1.05, 0.95],
                    }
              }
              transition={
                shouldReduceMotion
                  ? {
                      duration: 0,
                    }
                  : {
                      duration: 4.5,
                      repeat: 0,
                      ease: "easeInOut",
                    }
              }
              className="
                absolute
                -bottom-6
                left-1/2
                h-11
                w-[78%]
                -translate-x-1/2
                rounded-[50%]
                bg-black/25
                blur-xl
              "
            />

            <img
              src={homeMobile}
              alt="HiveMarket home screen"
              className="
                relative
                z-10
                drop-shadow-[0_28px_30px_rgba(0,0,0,0.22)]
              "
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}