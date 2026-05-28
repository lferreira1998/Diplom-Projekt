<div className="w-full max-w-lg flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mb-12 text-center"
                >
                  <h1
                    style={{
                      fontFamily: "'general-sans', sans-serif",
                      fontSize: "clamp(2rem, 6vw, 3.5rem)",
                      color: "#313642",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    Uninvited Thoughts
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-center mb-12 max-w-md"
                  style={{
                    fontFamily: "'general-sans', sans-serif",
                    fontSize: "0.95rem",
                    color: "#6B6F7B",
                    lineHeight: 1.7,
                  }}
                >
                  A dot moves across the screen. Follow it with your full
                  attention. Thoughts will arise on their own. Instead of
                  pushing them away, write them down and press Enter. Then
                  return your full attention to the dot. The next thought will
                  appear.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="mb-10 w-full"
                >
                  <p
                    className="text-center mb-4"
                    style={{
                      fontFamily: "'general-sans', sans-serif",
                      fontSize: "0.7rem",
                      color: "#9A9DAA",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    Duration
                  </p>

                  <div className="flex items-center justify-center px-[100px] py-[0px]">
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1.1rem",
                        borderRadius: "100px",
                        border: "1.5px dashed #D0D1D6",
                        backgroundColor: "transparent",
                      }}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={selectedMinutes === 0 ? "" : selectedMinutes}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value === "") {
                            setSelectedMinutes(0);
                            return;
                          }

                          if (/^\d+$/.test(value)) {
                            setSelectedMinutes(Number(value));
                          }
                        }}
                        placeholder="3"
                        style={{
                          fontFamily:
                            "'general-sans', sans-serif",
                          fontSize: "0.85rem",
                          letterSpacing: "0.05em",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          color: "#6B6F7B",
                          width: "50px",
                          textAlign: "center",
                        }}
                      />
                      <span
                        style={{
                          fontFamily:
                            "'general-sans', sans-serif",
                          fontSize: "0.85rem",
                          letterSpacing: "0.05em",
                          color: "#6B6F7B",
                        }}
                      >
                        min
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  onClick={() => {
                    if (!selectedMinutes || selectedMinutes < 1) {
                      setSelectedMinutes(3);
                    }
                    handleStart();
                  }}
                  className="group cursor-pointer"
                  style={{
                    fontFamily: "'general-sans', sans-serif",
                    fontSize: "0.8rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    padding: "0.9rem 3rem",
                    borderRadius: "100px",
                    border: "none",
                    backgroundColor: "#313642",
                    color: "#F2F3F6",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(49,54,66,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Begin
                </motion.button>
              </div>