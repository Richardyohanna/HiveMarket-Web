
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const faqs = [
  {
    question: 'What is HiveMarket?',
    answer:
      'HiveMarket is a community-focused marketplace that helps you discover local shops, explore products, connect with shop owners, and find what you need around you — all from one place.',
  },
  {
    question: 'Is HiveMarket only for students?',
    answer:
      'No. HiveMarket is designed for local communities. We are starting with campus communities as our MVP, but the long-term goal is to connect people with shops and businesses within their local communities.',
  },
  {
    question: 'Can I sell products on HiveMarket?',
    answer:
      'Yes. Shop owners and local businesses can create a shop, showcase their products, and make them discoverable to people within their community.',
  },
  {
    question: 'Do I need to pay to discover shops and products?',
    answer:
      'No. Discovering shops and browsing products on HiveMarket is free for users.',
  },
  {
    question: 'Can I buy products directly through HiveMarket?',
    answer:
      'HiveMarket helps you discover products and connect with shop owners. For the MVP, transactions are handled directly between the customer and the shop owner rather than through an in-app payment system.',
  },
  {
    question: 'How does the shopping list work?',
    answer:
      'You can select the products you are interested in and send a shopping list to the relevant shop owner. The shop owner can then review the request and respond to you.',
  },
  {
    question: 'How do I get the HiveMarket app?',
    answer:
      'You will be able to download HiveMarket from the supported app stores using the download buttons on this website. We will make the download links available as the app is released.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  const toggleFAQ = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-white py-20 sm:py-24"
    >
      {/* Decorative background */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-[#e8f5e9] blur-3xl"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -20, 0],
                y: [0, 15, 0],
                scale: [1, 1.08, 1],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-10 h-64 w-64 rounded-full bg-[#e8f5e9]/60 blur-3xl"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 20, 0],
                y: [0, -15, 0],
                scale: [1, 1.05, 1],
              }
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">

        {/* Heading */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 25,
                }
          }
          whileInView={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <h2
            className="
              mt-4
              text-3xl
              font-extrabold
              leading-tight
              tracking-[-1px]
              text-[#17191c]
              sm:text-4xl
              lg:text-[44px]
            "
          >
            Questions?
            <span className="text-[#008100]"> We've got answers.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-[#5b6269] sm:text-base">
            Everything you need to know about discovering shops,
            exploring products, and using HiveMarket.
          </p>
        </motion.div>

        {/* FAQ list */}
        <motion.div
          className="mt-12 space-y-3"
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView={shouldReduceMotion ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={faq.question}
                variants={{
                  hidden: {
                    opacity: 0,
                    y: 18,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                  },
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -2,
                      }
                }
                className={`
                  relative
                  overflow-hidden
                  rounded-xl
                  border
                  transition-colors
                  duration-300
                  ${
                    isOpen
                      ? 'border-[#cce5cf] bg-[#f8fbf8] shadow-[0_10px_30px_rgba(0,129,0,0.06)]'
                      : 'border-gray-200 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.02)]'
                  }
                `}
              >
                {/* Active accent */}
                <motion.div
                  className="absolute left-0 top-0 h-full w-[3px] bg-[#008100]"
                  initial={false}
                  animate={{
                    opacity: isOpen ? 1 : 0,
                    scaleY: isOpen ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.25,
                    ease: 'easeOut',
                  }}
                  style={{
                    transformOrigin: 'top',
                  }}
                />

                <motion.button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  whileTap={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 0.99,
                        }
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    gap-6
                    px-5
                    py-5
                    text-left
                    sm:px-6
                  "
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <motion.span
                    animate={{
                      color: isOpen ? '#008100' : '#17191c',
                    }}
                    transition={{ duration: 0.25 }}
                    className="
                      text-sm
                      font-semibold
                      sm:text-[15px]
                    "
                  >
                    {faq.question}
                  </motion.span>

                  <motion.span
                    animate={{
                      backgroundColor: isOpen ? '#008100' : '#f1f4f1',
                      color: isOpen ? '#ffffff' : '#4b5158',
                      rotate: isOpen ? 0 : 0,
                      scale: isOpen ? 1.05 : 1,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                    "
                  >
                    <motion.div
                      animate={{
                        rotate: isOpen ? 180 : 0,
                      }}
                      transition={{
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <ChevronDown size={17} />
                    </motion.div>
                  </motion.span>
                </motion.button>

                {/* Animated answer */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      key="answer"
                      initial={
                        shouldReduceMotion
                          ? {
                              opacity: 1,
                            }
                          : {
                              height: 0,
                              opacity: 0,
                            }
                      }
                      animate={
                        shouldReduceMotion
                          ? {
                              opacity: 1,
                            }
                          : {
                              height: 'auto',
                              opacity: 1,
                            }
                      }
                      exit={
                        shouldReduceMotion
                          ? {
                              opacity: 0,
                            }
                          : {
                              height: 0,
                              opacity: 0,
                            }
                      }
                      transition={{
                        height: {
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        },
                        opacity: {
                          duration: 0.25,
                        },
                      }}
                      className="overflow-hidden"
                    >
                      <motion.p
                        initial={
                          shouldReduceMotion
                            ? false
                            : {
                                y: -8,
                                opacity: 0,
                              }
                        }
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : {
                                y: 0,
                                opacity: 1,
                              }
                        }
                        transition={{
                          duration: 0.3,
                          delay: 0.05,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="
                          px-5
                          pb-5
                          text-sm
                          leading-7
                          text-[#697078]
                          sm:px-6
                        "
                      >
                        {faq.answer}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}

