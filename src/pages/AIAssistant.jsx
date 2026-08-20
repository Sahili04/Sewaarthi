import { useState, useRef, useEffect } from 'react'

// ── Medical & Pharmacological Knowledge Graph (Comprehensive Multilingual) ──
const CLINICAL_INSIGHTS = [
  {
    category: 'cold_cough',
    keywords: ['cold', 'cough', 'sore throat', 'khasi', 'khansi', 'jukam', 'zukam', 'khokla', 'sardi', 'gala', 'kaph', 'phlegm', 'खांसी', 'जुकाम', 'कफ', 'खोकला', 'सर्दी', 'गले में खराश', 'घसा'],
    reply: {
      en: "For cold, cough, and throat irritation:\n• 🍵 **Home Care:** Drink warm water, ginger-tulsi tea, and do warm salt-water gargles 2–3 times daily.\n• 💨 **Steam Inhalation:** Inhale steam once or twice a day to clear nasal congestion.\n• 💊 **Medications:** For dry cough, throat lozenges or honey-based syrup helps. For productive cough, consult your doctor for an expectorant. If fever exceeds 101°F or lasts >3 days, seek medical evaluation.",
      hi: "सर्दी, खांसी और गले की खराश के लिए उपाय:\n• 🍵 **घरेलू देखभाल:** गुनगुना पानी पिएं, अदरक-तुलसी की चाय लें और दिन में 2-3 बार गुनगुने नमक के पानी से गरारे करें।\n• 💨 **भाप लें:** बंद नाक और कफ से राहत के लिए दिन में एक-दो बार सादे पानी की भाप लें।\n• 💊 **दवाइयाँ:** सूखी खांसी में कफ सिरप या शहद-अदरक लाभ देता है। यदि बुखार 3 दिन से अधिक रहे या सांस लेने में तकलीफ हो, तो तुरंत डॉक्टर से परामर्श लें।",
      mr: "सर्दी, खोकला आणि घसा दुखण्यावर उपाय:\n• 🍵 **घरगुती काळजी:** कोमट पाणी प्या, आलं-तुळशीचा काढा घ्या आणि दिवसातून २-३ वेळा कोमट मिठाच्या पाण्याच्या गुळण्या करा.\n• 💨 **वाफ घ्या:** नाक मोकळे होण्यासाठी आणि कफ विरघळण्यासाठी दिवसातून एकदा-दोनदा वाफ घ्या.\n• 💊 **औषधे:** कोरड्या खोकल्यासाठी मध व आलं उपयुक्त ठरते. कफ जास्त असल्यास किंवा ३ दिवसांपेक्षा जास्त ताप राहिल्यास डॉक्टरांचा सल्ला घ्या."
    }
  },
  {
    category: 'fever',
    keywords: ['fever', 'bukhar', 'taap', 'tap', 'temperature', 'chills', 'thandi', 'dolo', 'paracetamol', 'crocin', 'बुखार', 'ताप', 'कपकपी', 'अंग गरम'],
    reply: {
      en: "Managing fever and elevated body temperature:\n• 💊 **Medication:** Paracetamol (Dolo 650 / Crocin) can be taken after meals. Keep at least a 6-hour gap between doses (maximum 3,000–4,000 mg in 24 hours).\n• 💧 **Hydration & Rest:** Drink plenty of fluids (water, ORS, soups) and get complete bed rest.\n• 🧊 **Cool Sponging:** If temperature rises above 102°F, apply a damp lukewarm cloth on forehead and arms.\n• ⚠️ **Warning:** If fever exceeds 103°F, lasts over 3 days, or is accompanied by rash or stiff neck, visit a doctor immediately.",
      hi: "बुखार और शरीर के तापमान पर नियंत्रण:\n• 💊 **दवाई:** पैरासिटामोल (डोलो 650 / क्रोसिन) भोजन के बाद लें। दो खुराकों में कम से कम 6 घंटे का अंतर रखें (24 घंटे में अधिकतम 4,000 mg)।\n• 💧 **तरल पदार्थ व आराम:** भरपूर पानी, ओआरएस और सूप पिएं तथा पर्याप्त आराम करें।\n• 🧊 **गीली पट्टी:** यदि बुखार 102°F से अधिक हो, तो माथे पर सामान्य पानी की पट्टी रखें।\n• ⚠️ **चेतावनी:** यदि बुखार 3 दिन से अधिक रहे या अत्यधिक कमजोरी महसूस हो, तो तुरंत डॉक्टर को दिखाएं।",
      mr: "ताप आणि अंगदुखीचे व्यवस्थापन:\n• 💊 **औषध:** पॅरासिटामॉल (डोलो ६५० / क्रोसिन) जेवणानंतर घ्यावे. दोन डोसमधील अंतर किमान ६ तास असावे (२४ तासांत जास्तीत जास्त ४,००० mg).\n• 💧 **पाणी आणि विश्रांती:** भरपूर पाणी, ओआरएस, सूप प्या आणि पूर्ण विश्रांती घ्या.\n• 🧊 **ओल्या कापडाच्या पट्ट्या:** ताप १०२°F पेक्षा जास्त असल्यास कपाळावर कोमट पाण्याच्या पट्ट्या ठेवा.\n• ⚠️ **महत्त्वाची सूचना:** ताप ३ दिवसांपेक्षा जास्त राहिल्यास किंवा तीव्र अशक्तपणा असल्यास डॉक्टरांना भेटा."
    }
  },
  {
    category: 'headache',
    keywords: ['headache', 'head ache', 'sir dard', 'sar dard', 'doke dukhi', 'dokedukhi', 'migraine', 'adhasisi', 'सिरदर्द', 'सर दर्द', 'डोकेदुखी', 'मायग्रेन', 'डोके'],
    reply: {
      en: "Relief for headaches and mental strain:\n• 💧 **Hydrate:** Dehydration is a leading cause of headaches; drink 1–2 glasses of water immediately.\n• 🧘 **Rest & Darkness:** Rest in a quiet, dimly lit room and avoid mobile/TV screens for 30 minutes.\n• ☕ **Gentle Relief:** Mild tea or a gentle forehead massage with balm can ease tension headaches.\n• ⚠️ If headache is sudden, unusually severe, or accompanied by blurred vision or vomiting, seek immediate medical attention.",
      hi: "सिरदर्द और तनाव से राहत के उपाय:\n• 💧 **पानी पिएं:** पानी की कमी सिरदर्द का मुख्य कारण हो सकती है; तुरंत 1-2 गिलास पानी पिएं।\n• 🧘 **शांत वातावरण:** शांत और मंद रोशनी वाले कमरे में विश्राम करें, मोबाइल और स्क्रीन से दूरी बनाएं।\n• ☕ **हल्की सिकाई:** अदरक की हल्की चाय या माथे की हल्की मालिश से आराम मिलता है।\n• ⚠️ यदि सिरदर्द अचानक बहुत तेज हो या उल्टी व चक्कर के साथ हो, तो तुरंत डॉक्टर से संपर्क करें।",
      mr: "डोकेदुखी आणि मानसिक तणावावर आराम:\n• 💧 **पाणी प्या:** शरीरातील पाण्याच्या कमतरतेमुळे डोकेदुखी होऊ शकते; लगेच १-२ ग्लास पाणी प्या.\n• 🧘 **शांतता आणि विश्रांती:** शांत, अंधाऱ्या खोलीत थोडा वेळ डोळे मिटून झोपा. मोबाईल किंवा टीव्ही स्क्रीन पाहणे टाळा.\n• ☕ **घरगुती उपाय:** आल्याचा चहा किंवा कपाळाला हलका मसाज केल्याने आराम मिळतो.\n• ⚠️ डोकेदुखी अचानक खूप तीव्र झाल्यास किंवा उलट्या-चक्कर येत असल्यास ताबडतोब डॉक्टरांचा सल्ला घ्या."
    }
  },
  {
    category: 'acidity_gas',
    keywords: ['acidity', 'gas', 'acid', 'heartburn', 'pantocid', 'pantoprazole', 'omeprazole', 'gelusil', 'digene', 'chhati me jalan', 'pitta', 'pet phulna', 'एसिडिटी', 'गैस', 'जलन', 'पित्त', 'अपचन'],
    reply: {
      en: "Managing Acidity, Gas, and Heartburn:\n• 💊 **Timing:** Antacids / PPIs (Pantoprazole, Omeprazole) work best when taken 30 minutes before breakfast on an empty stomach.\n• 🥛 **Natural Relief:** Sip cold milk, coconut water, or chew fennel seeds (saunf) after meals.\n• 🚫 **Avoid:** Limit oily, deeply fried, and overly spicy foods. Do not lie down flat immediately after eating — wait at least 2 hours.\n• 💧 Drink plenty of water throughout the day.",
      hi: "एसिडिटी, गैस और सीने की जलन से बचाव:\n• 💊 **दवा का समय:** गैस की दवा (पैंटोप्राजोल, ओमेप्राजोल) सुबह नाश्ते से 30 मिनट पहले खाली पेट लें।\n• 🥛 **प्राकृतिक उपाय:** ठंडा दूध, नारियल पानी या भोजन के बाद सौंफ चबाने से तुरंत राहत मिलती है।\n• 🚫 **परहेज:** तला-भुना, अत्यधिक मिर्च-मसालेदार खाना कम करें। भोजन के तुरंत बाद न लेटें, कम से कम 2 घंटे का अंतर रखें।\n• 💧 दिनभर घूंट-घूंट करके पर्याप्त पानी पिएं।",
      mr: "अ‍ॅसिडिटी, गॅस आणि छातीतील जळजळीवर उपाय:\n• 💊 **औषधांची वेळ:** अ‍ॅसिडिटीच्या गोळ्या (पँटोप्राझोल, ओमेप्राझोल) सकाळी नाश्त्यापूर्वी ३० मिनिटे रिकाम्या पोटी घ्या.\n• 🥛 **नैसर्गिक उपाय:** थंड दूध, नारळ पाणी प्या किंवा जेवणानंतर बडीशेप खाल्ल्याने आराम मिळतो.\n• 🚫 **काय टाळावे:** तेलकट, अति तिखट आणि जंक फूड टाळा. जेवल्या जेवल्या लगेच झोपू नका, किमान २ तास थांबा.\n• 💧 दिवसभरात पुरेसे पाणी पिणे आवश्यक आहे."
    }
  },
  {
    category: 'stomach_diarrhea',
    keywords: ['stomach pain', 'loose motion', 'diarrhea', 'vomit', 'vomiting', 'pet dard', 'dast', 'pothdukhi', 'julab', 'ulti', 'ors', 'पेट दर्द', 'दस्त', 'उल्टी', 'पोटदुखी', 'जुलाब'],
    reply: {
      en: "Stomach upset, Loose Motions, and Vomiting care:\n• 💧 **Hydration Priority (Crucial):** Drink ORS (Oral Rehydration Solution), coconut water, or lemon water with a pinch of salt and sugar to prevent dehydration.\n• 🥣 **BRAT Diet:** Eat light, easily digestible food: khichdi, curd-rice, bananas, and toast. Avoid milk and spicy curries.\n• 💊 **Medications:** Do not take anti-diarrheal pills without doctor consultation if fever or blood in stool is present.\n• ⚠️ Seek urgent medical help if urine output drops or vomiting prevents fluid retention.",
      hi: "पेट दर्द, दस्त और उल्टी की स्थिति में देखभाल:\n• 💧 **ओआरएस (ORS) सबसे जरूरी:** पानी की कमी से बचने के लिए ओआरएस का घोल, नारियल पानी या नमक-चीनी का पानी बार-बार पिएं।\n• 🥣 **हल्का आहार:** मूंग दाल की खिचड़ी, दही-चावल, केला और उबले आलू खाएं। दूध और भारी भोजन से बचें।\n• 💊 **दवाई:** बिना डॉक्टर की सलाह के दस्त रोकने की दवाएं न लें, विशेषकर यदि बुखार भी हो।\n• ⚠️ यदि पेशाब कम आए, कमजोरी अत्यधिक हो या लगातार उल्टी हो, तो तुरंत अस्पताल जाएं।",
      mr: "पोटदुखी, जुलाब आणि उलट्यांवरील उपचार:\n• 💧 **ओआरएस (ORS) अत्यंत महत्त्वाचे:** डिहायड्रेशन टाळण्यासाठी ओआरएसचे पाणी, नारळपाणी किंवा मीठ-साखरेचे पाणी वारंवार प्या.\n• 🥣 **हलका आहार:** मऊ मुगाची खिचडी, दही-भात, केळी यांसारखे पचायला हलके अन्न खा. तेलकट आणि दुग्धजन्य पदार्थ टाळा.\n• 💊 **औषध:** डॉक्टरांच्या सल्ल्याशिवाय जुलाब थांबवण्याच्या तीव्र गोळ्या घेऊ नका.\n• ⚠️ तीव्र अशक्तपणा, लघवी कमी होणे किंवा सतत उलट्या होत असल्यास ताबडतोब डॉक्टरांकडे जा."
    }
  },
  {
    category: 'diabetes',
    keywords: ['diabetes', 'sugar', 'metformin', 'glycomet', 'glimepiride', 'insulin', 'madhumeh', 'hba1c', 'मधुमेह', 'डायबिटीज', 'साखर', 'शुगर', 'फास्टिंग'],
    reply: {
      en: "Diabetes & Blood Sugar Management:\n• 💊 **Medication:** Take Metformin with or right after meals to avoid gastric distress. Never skip doses without doctor guidance.\n• 🥗 **Dietary Advice:** Incorporate whole grains (oats, millets/jowar), green vegetables, and lentils. Limit white rice, sweets, potatoes, and sugary juices.\n• ⚠️ **Hypoglycemia (Low Sugar <70 mg/dL):** If you feel sudden sweating, trembling, or dizziness, immediately consume 3 spoons of sugar, fruit juice, or candy (15-15 Rule).\n• 🏃 Engage in 30 minutes of brisk walking daily.",
      hi: "मधुमेह (शुगर) नियंत्रण और आहार:\n• 💊 **दवाइयाँ:** मेटफॉर्मिन भोजन के साथ या तुरंत बाद लें। डॉक्टर की सलाह के बिना खुराक कभी न छोड़ें।\n• 🥗 **आहार:** साबुत अनाज (ज्वार, बाजरा, ओट्स), हरी सब्जियां और दालें खाएं। चीनी, सफेद चावल और आलू सीमित करें।\n• ⚠️ **लो शुगर (हाइपोग्लाइसीमिया <70 mg/dL):** यदि अचानक पसीना, कंपन या चक्कर आए, तो तुरंत 3 चम्मच चीनी, ग्लूकोज या फलों का रस लें।\n• 🏃 रोज़ाना 30 मिनट टहलने की आदत डालें।",
      mr: "मधुमेह (डायबिटीज) आणि रक्तातील साखरेचे नियंत्रण:\n• 💊 **औषधे:** मेटफॉर्मिन जेवणासोबत किंवा जेवणानंतर लगेच घ्यावे. वेळेवर औषध घेणे अत्यंत महत्त्वाचे आहे.\n• 🥗 **आहार:** आहारात ज्वारी, नाचणी, हिरव्या पालेभाज्या आणि कडधान्यांचा समावेश करा. साखर, गोड पदार्थ व मैद्याचे पदार्थ टाळा.\n• ⚠️ **साखर अचानक कमी झाल्यास (<७० mg/dL):** थरकाप, घाम किंवा चक्कर आल्यास ताबडतोब ३ चमचे साखर, गूळ किंवा फळांचा रस प्या.\n• 🏃 दररोज किमान ३० मिनिटे चालण्याचा व्यायाम करा."
    }
  },
  {
    category: 'hypertension',
    keywords: ['bp', 'blood pressure', 'hypertension', 'amlodipine', 'telmisartan', 'losartan', 'atenolol', 'high bp', 'रक्तदाब', 'ब्लड प्रेशर', 'बीपी', 'उच्च रक्तदाब'],
    reply: {
      en: "High Blood Pressure (Hypertension) Guidelines:\n• ⏰ **Consistency:** Take your BP medication at the exact same hour every day. Do not stop medicines even if your BP readings appear normal.\n• 🧂 **Sodium/Salt:** Restrict table salt to less than 1 teaspoon (5g) per day. Avoid packaged snacks, papad, and pickles.\n• 🥦 **DASH Diet:** Eat foods rich in potassium: bananas, spinach, coconut water, and citrus fruits.\n• 🧘 Manage stress with deep breathing and regular 30-minute walks.",
      hi: "हाई ब्लड प्रेशर (उच्च रक्तचाप) के लिए दिशानिर्देश:\n• ⏰ **नियमितता:** बीपी की दवा हर दिन ठीक उसी समय लें। बीपी सामान्य होने पर भी दवा कभी बंद न करें।\n• 🧂 **नमक पर नियंत्रण:** दिनभर में 1 छोटे चम्मच (5 ग्राम) से कम नमक का उपयोग करें। अचार, पापड़ और नमकीन से बचें।\n• 🥦 **पोषक आहार:** पोटैशियम युक्त आहार जैसे केला, पालक, नारियल पानी और ताजे फल खाएं।\n• 🧘 गहरी सांस लेने का अभ्यास करें और रोज़ 30 मिनट टहलें।",
      mr: "उच्च रक्तदाब (बीपी) नियंत्रणात ठेवण्याचे नियम:\n• ⏰ **वेळेचे पालन:** बीपीचे औषध दररोज ठरलेल्या वेळीच घ्या. रक्तदाब सामान्य आला तरी डॉक्टरांना विचारल्याशिवाय औषध बंद करू नका.\n• 🧂 **मीठ कमी करा:** दिवसाला १ चमच्यापेक्षा (५ ग्रॅम) कमी मीठ वापरा. लोणचे, पापड व खारट पदार्थ टाळा.\n• 🥦 **पौष्टिक आहार:** केळी, पालक, नारळपाणी आणि हिरव्या भाज्या खा.\n• 🧘 तणावमुक्त राहा, ध्यान करा आणि दररोज ३० मिनिटे फिरायला जा."
    }
  },
  {
    category: 'joint_pain',
    keywords: ['joint pain', 'knee pain', 'back pain', 'arthritis', 'sandhe dukhi', 'jod dard', 'kamar dard', 'uric acid', 'जोड़ों का दर्द', 'कमर दर्द', 'घुटनों का दर्द', 'सांधेदुखी', 'पाठीचे दुखणे'],
    reply: {
      en: "Joint, Knee, and Back Pain Relief:\n• 🧊 **Hot/Cold Compress:** Apply a warm towel/heating pad for muscle stiffness, or an ice pack for acute swelling.\n• 🏃 **Low-Impact Movement:** Gentle walking, swimming, and knee-strengthening exercises preserve joint mobility.\n• 🥛 **Bone Strength:** Ensure adequate Calcium and Vitamin D3 intake (sunlight exposure, milk, paneer).\n• ⚠️ Avoid lifting heavy weights directly and avoid sitting on the floor if knee pain is severe.",
      hi: "जोड़ों, घुटनों और कमर दर्द से राहत:\n• 🧊 **गर्म/ठंडी सिकाई:** अकड़न में गर्म पानी की थैली से सिकाई करें, और सूजन में बर्फ की सिकाई लाभ देती है।\n• 🏃 **हल्का व्यायाम:** घुटनों के हल्के व्यायाम और सुबह की सैर से जोड़ों का लचीलापन बना रहता है।\n• 🥛 **हड्डियों की मजबूती:** कैल्शियम और विटामिन D3 युक्त आहार (धूप, दूध, तिल) लें।\n• ⚠️ भारी वजन उठाने से बचें और घुटने में तेज दर्द हो तो नीचे बैठने से परहेज करें।",
      mr: "सांधेदुखी, गुडघेदुखी आणि कंबरदुखीवर उपाय:\n• 🧊 **शेक देणे:** सांधे आखडले असल्यास गरम पाण्याचा शेक द्या, आणि सूज असल्यास बर्फाने शेका.\n• 🏃 **हलका व्यायाम:** दररोज सकाळी चालणे आणि गुडघ्यांचे साधे व्यायाम सांधे लवचिक ठेवण्यास मदत करतात.\n• 🥛 **हाडांची मजबुती:** कोवळे ऊन, दूध, नाचणी यातून कॅल्शियम आणि व्हिटॅमिन D3 मिळवा.\n• ⚠️ जास्त वजन उचलणे टाळा आणि गुडघेदुखी जास्त असल्यास मांडी घालून बसणे टाळा."
    }
  },
  {
    category: 'sleep_stress',
    keywords: ['sleep', 'insomnia', 'stress', 'tension', 'anxiety', 'neend', 'thakan', 'zhop', 'tanav', 'ashaktpana', 'नींद', 'तनाव', 'थकान', 'झोप', 'अशक्तपणा', 'चिंता'],
    reply: {
      en: "Restful Sleep & Stress Reduction:\n• 📵 **Digital Curfew:** Turn off smartphones and screens at least 45 minutes before bedtime.\n• 🥛 **Bedtime Routine:** Drink a cup of warm turmeric milk or chamomile tea, and keep your bedroom cool and dark.\n• 🧘 **Breathing:** Practice 4-7-8 deep breathing to calm the nervous system before sleeping.\n• ⏰ Maintain consistent sleep and wake-up times every day.",
      hi: "अच्छी नींद और मानसिक शांति के उपाय:\n• 📵 **स्क्रीन से दूरी:** सोने से 45 मिनट पहले मोबाइल और टीवी बंद कर दें।\n• 🥛 **रात की दिनचर्या:** सोने से पहले हल्का गुनगुना हल्दी वाला दूध पिएं और कमरे में शांति व अंधेरा रखें।\n• 🧘 **प्राणायाम:** सोने से पहले 5 मिनट गहरी सांस लेने का अभ्यास करें जिससे मन शांत होता है।\n• ⏰ रोज़ाना एक ही समय पर सोने और जागने का नियम बनाएं।",
      mr: "शांत झोप आणि तणावमुक्तीसाठी टिप्स:\n• 📵 **स्क्रीन बंद करा:** झोपण्यापूर्वी किमान ४५ मिनिटे मोबाईल व टीव्ही पाहणे टाळा.\n• 🥛 **रात्रीची सवय:** झोपण्यापूर्वी कोमट हळदीचे दूध प्या आणि शांत वातावरणात विश्रांती घ्या.\n• 🧘 **दीर्घ श्वसन:** झोपण्यापूर्वी ५ मिनिटे दीर्घ श्वास घेतल्यास मन आणि मेंदू शांत होतो.\n• ⏰ दररोज झोपण्याची आणि उठण्याची एकच वेळ निश्चित ठेवा."
    }
  },
  {
    category: 'diet_weight',
    keywords: ['diet', 'weight loss', 'vajan kam', 'vajan ghatana', 'nutrition', 'food', 'aahar', 'poshan', 'वजन घटाना', 'डाइट', 'आहार', 'वजन कमी', 'पोषण'],
    reply: {
      en: "Healthy Weight & Nutrition Strategy:\n• 🥗 **Plate Method:** Fill half your plate with vegetables/salad, one quarter with protein (dal, sprouts, paneer, eggs), and one quarter with complex carbs (millets, oats, brown rice).\n• 💧 **Water Timing:** Drink a full glass of water 20 minutes before meals to naturally moderate portion size.\n• 🚫 **Cut Sugar:** Eliminate refined sugar, sodas, and packaged bakery products.\n• 🚶 Walk at least 7,000–10,000 steps daily for sustainable metabolism.",
      hi: "स्वस्थ वजन और पोषण युक्त आहार:\n• 🥗 **संतुलित थाली:** आधी थाली हरी सब्जियों और सलाद से, एक चौथाई प्रोटीन (दाल, स्प्राउट्स, पनीर) और एक चौथाई अनाज (ज्वार, बाजरा) से भरें।\n• 💧 **पानी का नियम:** भोजन से 20 मिनट पहले 1 गिलास पानी पिएं जिससे पाचन सुधरता है।\n• 🚫 **मीठा बंद:** चीनी, कोल्ड ड्रिंक्स और मैदे से बनी चीजों का सेवन बंद या बहुत कम करें।\n• 🚶 रोज़ाना 30-45 मिनट तेज गति से टहलें।",
      mr: "वजन नियंत्रण आणि संतुलित आहार:\n• 🥗 **ताटाचे नियोजन:** ताटातील अर्धा भाग पालेभाज्या व सॅलड, पाव भाग प्रथिने (डाळी, मोड आलेली कडधान्ये, अंडी) आणि पाव भाग भाकरी असावा.\n• 💧 **पाण्याची वेळ:** जेवणापूर्वी २० मिनिटे एक ग्लास पाणी प्या.\n• 🚫 **साखर टाळा:** साखर, गोड पेये, मैदा आणि बेकरी उत्पादने आहारातून कमी करा.\n• 🚶 दररोज किमान ७,००० ते १०,००० पावले चालण्याचा नियम ठेवा."
    }
  }
]

// ── Text Formatter ──
function FormattedText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*.*?\*\*)/g)
        return (
          <div key={li} style={{ minHeight: line.trim() === '' ? 8 : undefined, marginBottom: 4 }}>
            {parts.map((part, pi) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pi} style={{ color: 'inherit', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
              }
              return <span key={pi}>{part}</span>
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── Helpers ──
function parseWaterIntake(text) {
  const lower = text.toLowerCase()
  const glassMatch = lower.match(/(\d+)\s*(?:glass|glasses|गिलास|ग्लास)/)
  if (glassMatch) return parseInt(glassMatch[1], 10) * 250
  if (lower.includes('glass of water') || lower.includes('one glass') || lower.includes('1 glass') || lower.includes('ek glass') || lower.includes('एक ग्लास') || lower.includes('एक गिलास')) return 250
  if (lower.includes('two glasses') || lower.includes('2 glasses') || lower.includes('do glass') || lower.includes('दोन ग्लास') || lower.includes('दो गिलास')) return 500

  const mlMatch = lower.match(/(\d+)\s*(?:ml|milliliter|millilitre|मिली|मिलीलीटर)/)
  if (mlMatch) return parseInt(mlMatch[1], 10)

  const literMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:l|liter|litre|liters|litres|लीटर|लिटर)/)
  if (literMatch) return Math.round(parseFloat(literMatch[1]) * 1000)

  if (lower.includes('water') || lower.includes('pani') || lower.includes('paani') || lower.includes('पानी') || lower.includes('पाणी') || lower.includes('hydrat')) {
    const numMatch = lower.match(/(\d+)/)
    if (numMatch) {
      const val = parseInt(numMatch[1], 10)
      return val > 20 ? val : val * 250
    }
    return 250
  }
  return null
}

function parseMedicineSchedule(text) {
  const lower = text.toLowerCase()
  const hasMedTrigger = lower.includes('med') || lower.includes('tablet') || lower.includes('pill') || lower.includes('dose') ||
    lower.includes('dawai') || lower.includes('goli') || lower.includes('remind') || lower.includes('schedule') ||
    lower.includes('take') || lower.includes('add') || lower.includes('start') || lower.includes('दवाई') ||
    lower.includes('औषध') || lower.includes('गोळी') || lower.includes('जोड़ा') || lower.includes('जोडा')

  if (!hasMedTrigger) return null

  let name = ''
  const namePatterns = [
    /(?:add|schedule|take|prescribe|remind me to take|med|medicine|tablet|goli|dawai|दवाई|औषध|गोळी)\s+([a-zA-Z0-9\u0900-\u097F\s]{2,25}?)(?:\s+\d+mg|\s+\d+ml|\s+tablet|\s+morning|\s+afternoon|\s+night|\s+evening|\s+before|\s+after|$)/i,
    /([A-Z][a-zA-Z0-9]+)/
  ]
  for (const p of namePatterns) {
    const m = text.match(p)
    if (m && m[1]) {
      const cand = m[1].replace(/^(medicine|tablet|pill|dawai|goli|to|the|my|a|an|दवाई|औषध|गोळी)\s+/i, '').trim()
      if (cand && cand.length >= 3 && !['water','glass','schedule','remind','routine','pani','paani','पानी','पाणी'].includes(cand.toLowerCase())) {
        name = cand
        break
      }
    }
  }
  if (!name) {
    const words = text.split(/\s+/).filter(w => !['add','schedule','medicine','tablet','pill','water','take','remind','me','to','in','the','at','morning','night','evening','afternoon','after','before','food','with','pani','dawai','goli','दवाई','औषध'].includes(w.toLowerCase()))
    if (words.length > 0) name = words[0]
  }

  if (!name || name.length < 2) return null

  let dosage = '1 tablet'
  const doseMatch = text.match(/(\d+\s*(?:mg|ml|mcg|iu|tablet|tablets|capsule|capsules|pill|pills|drops|एमजी|मिली|गोली|गोळी))/i)
  if (doseMatch) dosage = doseMatch[1]
  else if (text.match(/(\d+)\s*(?:tab|cap)/i)) dosage = text.match(/(\d+)\s*(?:tab|cap)/i)[1] + ' tablet'

  let times = []
  let slots = {
    morning:   { enabled: false, time: '08:00' },
    afternoon: { enabled: false, time: '13:00' },
    night:     { enabled: false, time: '21:00' }
  }

  if (lower.includes('morning') || lower.includes('subah') || lower.includes('breakfast') || lower.includes('सुबह') || lower.includes('सकाळी')) {
    slots.morning.enabled = true
    times.push('08:00')
  }
  if (lower.includes('afternoon') || lower.includes('dopahar') || lower.includes('lunch') || lower.includes('दोपहर') || lower.includes('दुपारी')) {
    slots.afternoon.enabled = true
    times.push('13:00')
  }
  if (lower.includes('night') || lower.includes('evening') || lower.includes('dinner') || lower.includes('raat') || lower.includes('soote') || lower.includes('रात') || lower.includes('रात्री') || lower.includes('संध्याकाळी')) {
    slots.night.enabled = true
    times.push('21:00')
  }

  const timeExplicit = text.match(/(?:at|@|बजे|वाजता)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (timeExplicit) {
    let hh = parseInt(timeExplicit[1], 10)
    const mm = timeExplicit[2] ? timeExplicit[2] : '00'
    const ampm = (timeExplicit[3] || '').toLowerCase()
    if (ampm === 'pm' && hh < 12) hh += 12
    if (ampm === 'am' && hh === 12) hh = 0
    const formatted = `${String(hh).padStart(2,'0')}:${mm}`
    times = [formatted]
    if (hh < 12) slots.morning = { enabled: true, time: formatted }
    else if (hh < 17) slots.afternoon = { enabled: true, time: formatted }
    else slots.night = { enabled: true, time: formatted }
  }

  if (times.length === 0) {
    slots.morning.enabled = true
    times.push('08:00')
  }

  let foodTiming = 'after'
  if (lower.includes('before food') || lower.includes('before meal') || lower.includes('empty stomach') || lower.includes('bhukhe pet') || lower.includes('खाने से पहले') || lower.includes('जेवणापूर्वी')) foodTiming = 'before'
  if (lower.includes('with food') || lower.includes('with meal') || lower.includes('khate waqt') || lower.includes('खाने के साथ') || lower.includes('जेवणासोबत')) foodTiming = 'with'

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    dosage,
    foodTiming,
    times,
    time: times[0],
    slots,
    duration: 14,
    notes: 'Scheduled via Sewaarthi AI',
    status: 'pending',
  }
}

// ── Smart Dynamic AI Responder (Handles ANY Question) ──
async function generateSmartAIResponse(userQuery, activeLang, userContext) {
  // 1. Check if user configured Gemini API Key in Vercel / environment
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY
  if (apiKey) {
    try {
      const systemPrompt = `You are Sewaarthi AI, a warm, caring, expert healthcare companion for patients and seniors in India.
Target language for response: ${activeLang === 'hi' ? 'Hindi (हिंदी script)' : activeLang === 'mr' ? 'Marathi (मराठी script)' : 'English'}.
User Context: Scheduled Medicines count: ${userContext.totalMeds}, Water intake today: ${userContext.waterIntake}ml of ${userContext.waterGoal}ml goal.

Instructions:
1. Provide accurate, practical, empathetic medical advice.
2. Structure with bullet points (**bold keys**) so it is easy to read.
3. If giving medication precautions, mention food timing, hydration, and when to see a doctor.
4. Always respond completely in ${activeLang === 'hi' ? 'Hindi' : activeLang === 'mr' ? 'Marathi' : 'English'}.

User Query: "${userQuery}"`

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
        })
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && text.trim().length > 10) return text.trim()
      }
    } catch(e) {
      console.warn('Gemini live fetch fallback to local engine:', e)
    }
  }

  // 2. Comprehensive Multilingual Clinical Knowledge Engine
  const lower = userQuery.toLowerCase()
  for (const item of CLINICAL_INSIGHTS) {
    if (item.keywords.some(k => lower.includes(k.toLowerCase()))) {
      return item.reply[activeLang] || item.reply['en']
    }
  }

  // 3. Dynamic Contextual Health Advice Generator (When query is broad or conversational)
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste') || lower.includes('namaskar') || lower.includes('नमस्ते') || lower.includes('नमस्कार')) {
    return activeLang === 'hi'
      ? `नमस्ते! 🙏 मैं आपका स्वास्थ्य साथी हूँ। आप मुझसे अपनी दवाइयों, किसी भी बीमारी के लक्षण, पानी के सेवन या स्वास्थ्य आहार के बारे में कुछ भी पूछ सकते हैं।`
      : activeLang === 'mr'
      ? `नमस्कार! 🙏 मी तुमचा आरोग्य साथी आहे. तुम्ही मला तुमची औषधे, आजारांची लक्षणे, पाण्याचे प्रमाण किंवा आहाराबद्दल काहीही विचारू शकता.`
      : `Hello! 🙏 I am your Sewaarthi health companion. You can ask me about your medications, symptoms, hydration, diet, or any health inquiry.`
  }

  if (lower.includes('diet') || lower.includes('food') || lower.includes('khana') || lower.includes('jevan') || lower.includes('खाना') || lower.includes('जेवण')) {
    return activeLang === 'hi'
      ? `स्वस्थ और संतुलित आहार के लिए मुख्य सुझाव:\n• 🥗 **हरी सब्जियां और दालें:** अपनी थाली में ताजी सब्जियां, दालें और फल भरपूर मात्रा में शामिल करें।\n• 🫓 **साबुत अनाज:** गेहूं की जगह ज्वार, बाजरा या रागी का सेवन अधिक गुणकारी होता है।\n• 💧 **पानी:** भोजन से आधा घंटा पहले पर्याप्त पानी पिएं।\n• 🚫 **परहेज:** ज्यादा तला हुआ, अत्यधिक मसालेदार और पैकेटबंद भोजन कम से कम खाएं।`
      : activeLang === 'mr'
      ? `निरोगी आणि संतुलित आहारासाठी महत्त्वाचे नियम:\n• 🥗 **पालेभाज्या आणि कडधान्ये:** आहारात भरपूर हिरव्या भाज्या, डाळी आणि मोडाची कडधान्ये असावीत.\n• 🫓 **धान्य:** गव्हाऐवजी ज्वारी, बाजरी किंवा नाचणीची भाकरी खाणे आरोग्यासाठी उत्तम असते.\n• 💧 **पाणी:** जेवणाच्या अर्धा तास आधी एक ग्लास पाणी प्या.\n• 🚫 **परहेज:** जास्त तेलकट, अति तिखट आणि जंक फूड टाळा.`
      : `Key guidelines for a balanced, healthy diet:\n• 🥗 **Veggies & Pulses:** Include generous portions of green leafy vegetables, lentils, and seasonal fruits.\n• 🫓 **Whole Grains:** Millets (Jowar, Bajra, Ragi) and oats provide sustained energy and fiber.\n• 💧 **Hydration:** Drink water 30 minutes before meals to aid digestion.\n• 🚫 **Avoid:** Reduce refined sugars, deep-fried items, and processed snacks.`
  }

  if (lower.includes('water') || lower.includes('pani') || lower.includes('paani') || lower.includes('पानी') || lower.includes('पाणी')) {
    return activeLang === 'hi'
      ? `दैनिक पानी का महत्व:\n• 💧 प्रतिदिन 2.5 से 3 लीटर पानी पीना शरीर से विषाक्त पदार्थों को निकालने और दवाइयों के अवशोषण के लिए आवश्यक है।\n• ⏰ सुबह उठकर 1-2 गिलास गुनगुना पानी पीना पाचन तंत्र को सक्रिय करता है।`
      : activeLang === 'mr'
      ? `दैनंदिन पाण्याचे महत्त्व:\n• 💧 दररोज २.५ ते ३ लिटर पाणी प्यायल्याने शरीरातील विषारी घटक बाहेर पडतात आणि औषधांचे शोषण योग्य होते.\n• ⏰ सकाळी उठल्यावर १-२ ग्लास कोमट पाणी पिणे पचनासाठी अत्यंत फायदेशीर आहे.`
      : `Importance of Daily Hydration:\n• 💧 Drinking 2.5–3.0 liters of water daily ensures optimal kidney filtration and medicine absorption.\n• ⏰ Starting your morning with 1–2 glasses of warm water jumpstarts digestion.`
  }

  // 4. Personalized Smart Synthesis Response
  return activeLang === 'hi'
    ? `आपके स्वास्थ्य सवाल: "${userQuery}" के लिए महत्वपूर्ण सलाह:\n\n• 🩺 **दवा और सावधानी:** यदि आप कोई नियमित दवा ले रहे हैं, तो समय पर लें और पर्याप्त पानी पिएं।\n• 🥗 **आराम और पोषण:** हल्का व पौष्टिक आहार लें और 7-8 घंटे की पूरी नींद लें।\n• ⚠️ **डॉक्टर से संपर्क:** यदि लक्षण गंभीर हैं या 2-3 दिन से बने हुए हैं, तो नजदीकी डॉक्टर से जांच अवश्य करवाएं।`
    : activeLang === 'mr'
    ? `तुमच्या आरोग्याच्या प्रश्नाबाबत ("${userQuery}") महत्त्वाचा सल्ला:\n\n• 🩺 **औषध आणि काळजी:** जर तुम्ही नियमित औषधे घेत असाल, तर ती वेळेवर घ्या आणि पुरेसे पाणी प्या.\n• 🥗 **विश्रांती आणि पोषण:** हलका व सकस आहार घ्या आणि ७-८ तास गाढ झोप घ्या.\n• ⚠️ **वैद्यकीय सल्ला:** त्रास जास्त असल्यास किंवा २-३ दिवसांपेक्षा अधिक काळ टिकून राहिल्यास डॉक्टरांचा सल्ला घ्या.`
    : `Key Health Advice for: "${userQuery}":\n\n• 🩺 **Care & Precautions:** Stay on track with any prescribed medicines and maintain adequate hydration.\n• 🥗 **Rest & Nutrition:** Eat light, nourishing foods and ensure 7–8 hours of sound sleep.\n• ⚠️ **Medical Consultation:** If your symptoms are severe or persist over 2–3 days, please consult a qualified doctor.`
}

export default function AIAssistant({ medicines = [], onAddMedicine, onUpdateStatus, onAddWater, onNavigate, user, userProfile, lang = 'en' }) {
  const [messages, setMessages] = useState([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [thinkingTip, setThinkingTip] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voiceLang, setVoiceLang] = useState(lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN')

  // Derive active assistant language: 'en', 'hi', or 'mr'
  const activeLang = voiceLang.startsWith('hi') ? 'hi' : voiceLang.startsWith('mr') ? 'mr' : (lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en')

  const recognitionRef = useRef(null)
  const endRef = useRef(null)

  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const displayName = user?.displayName || userProfile?.name || user?.email?.split('@')[0] || (activeLang === 'hi' ? 'दोस्त' : activeLang === 'mr' ? 'मित्र' : 'Friend')

  // Keep voiceLang synced when app lang changes
  useEffect(() => {
    const targetCode = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    setVoiceLang(targetCode)
  }, [lang])

  // Dynamic context metrics
  const totalMeds = medicines.length
  const takenMeds = medicines.filter(m => m.status === 'taken').length
  const pendingMeds = medicines.filter(m => m.status === 'pending').length
  const waterGoal = parseFloat(userProfile?.waterGoalLiters || 2.5) * 1000
  const localWater = Number(localStorage.getItem('sw_water_' + (user?.uid || '') + '_' + today) || 0)
  const waterPercent = Math.min(Math.round((localWater / waterGoal) * 100), 100)
  const nextMed = medicines.find(m => m.status === 'pending')

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = voiceLang

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setInput(transcript)
        if (event.results[0].isFinal) {
          setIsListening(false)
          handleUserMessage(transcript)
        }
      }

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [voiceLang])

  // Text-to-Speech Vocalizer helper
  const speakText = (textToSpeak) => {
    if (!voiceEnabled || !window.speechSynthesis) return
    try {
      window.speechSynthesis.cancel()
      const clean = textToSpeak.replace(/\*\*/g, '').replace(/•/g, '').replace(/💡|💊|💧|⚖️|⏰|🍽️|✅|🚨|🤖|⚡|🎉|🍵|💨|🧊|🧘|🥛|🥣|🥗|🏃|🥦|🧂|📵|🫓|🚶/g, '')
      const utterance = new SpeechSynthesisUtterance(clean)
      utterance.rate = 0.92
      utterance.pitch = 1.0
      utterance.lang = voiceLang
      window.speechSynthesis.speak(utterance)
    } catch(e) {}
  }

  const toggleListening = () => {
    if (!speechSupported) {
      alert("Voice input is not supported in this browser. Please use Google Chrome, Edge, or Safari.")
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.lang = voiceLang
        recognitionRef.current.start()
        setIsListening(true)
      } catch(e) {
        console.warn(e)
      }
    }
  }

  // Initial proactive greeting with multilingual support
  useEffect(() => {
    let greetingText = ''
    if (activeLang === 'hi') {
      greetingText = hour < 12
        ? `सुप्रभात, ${displayName}! 🌅\nमैं आपका सेवार्थी AI स्वास्थ्य साथी हूँ। मैं आपकी दवाइयाँ, पानी का सेवन और स्वास्थ्य सवालों के लिए यहाँ हूँ।`
        : hour < 17
        ? `शुभ दोपहर, ${displayName}! ☀️\nआशा है आपका दिन अच्छा बीत रहा है। मुझसे किसी भी बीमारी, दवा या स्वास्थ्य सलाह के बारे में पूछें।`
        : `शुभ संध्या, ${displayName}! 🌙\nआज की दवाइयाँ और पानी का लक्ष्य पूरा करें। स्वास्थ्य संबंधी कोई भी प्रश्न हो तो पूछें।`
    } else if (activeLang === 'mr') {
      greetingText = hour < 12
        ? `सुप्रभात, ${displayName}! 🌅\nमी तुमचा सेवार्थी AI आरोग्य साथी आहे. मी तुमच्या औषधे, पाणी आणि आरोग्याच्या प्रश्नांसाठी येथे आहे.`
        : hour < 17
        ? `शुभ दुपार, ${displayName}! ☀️\nतुमचा दिवस चांगला जात असेल अशी आशा आहे. मला कोणताही आजार, औषध किंवा आरोग्याबद्दल विचारा.`
        : `शुभ संध्याकाळ, ${displayName}! 🌙\nआजची सर्व औषधे आणि पाण्याचे उद्दिष्ट पूर्ण करा. कोणताही आरोग्य प्रश्न विचारा.`
    } else {
      greetingText = hour < 12
        ? `Good morning, ${displayName}! 🌅\nI'm your Sewaarthi AI health companion. Ask me anything about your symptoms, medications, or wellness.`
        : hour < 17
        ? `Good afternoon, ${displayName}! ☀️\nHope your day is going well. I'm here to help with your health questions, medications, and hydration.`
        : `Good evening, ${displayName}! 🌙\nTime to wind down. Check today's medicines and ask me any health questions.`
    }

    setMessages([
      {
        role: 'bot',
        text: greetingText,
        card: {
          type: 'daily_briefing',
          data: {
            takenMeds,
            totalMeds,
            pendingMeds,
            waterIntake: localWater,
            waterGoal,
            waterPercent,
            nextMed
          }
        }
      }
    ])
  }, [user, userProfile, activeLang])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Dynamic intelligent prompt suggestions in active language
  const dynamicChips = activeLang === 'hi' ? [
    nextMed ? `💊 ${nextMed.name} लें` : '📋 आज की दवाइयाँ',
    waterPercent < 100 ? '💧 250ml पानी दर्ज करें' : '💧 पानी की स्थिति',
    '🍵 सर्दी-खांसी के उपाय',
    '🩺 बीपी और शुगर डाइट',
    '⚖️ मेरा BMI जांचें',
    '💊 सिरदर्द का इलाज'
  ] : activeLang === 'mr' ? [
    nextMed ? `💊 ${nextMed.name} घ्या` : '📋 आजची औषधे',
    waterPercent < 100 ? '💧 250ml पाणी नोंदवा' : '💧 पाण्याची स्थिती',
    '🍵 सर्दी-खोकल्यावर उपाय',
    '🩺 बीपी व मधुमेह आहार',
    '⚖️ माझा BMI तपासा',
    '💊 डोकेदुखीवर उपाय'
  ] : [
    nextMed ? `💊 Take ${nextMed.name}` : '📋 Today’s Meds',
    waterPercent < 100 ? '💧 Log 250ml Water' : '💧 Water Status',
    '🍵 Cold & Cough Care',
    '🩺 BP & Diabetes Diet',
    '⚖️ Check my BMI',
    '💊 Headache Relief'
  ]

  const handleUserMessage = async (rawText) => {
    const msg = (rawText || input).trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    const lower = msg.toLowerCase()

    // ── 1. Mark Medicine as Taken via Chat ──
    const isMarkTaken = (
      lower.includes('took') || lower.includes('taken') || lower.includes('consumed') || lower.includes('mark') ||
      lower.includes('le li') || lower.includes('le liya') || lower.includes('kha li') || lower.includes('kha liya') ||
      lower.includes('ghetli') || lower.includes('ghetle') || lower.includes('khalli') || lower.includes('घेतली') ||
      lower.includes('घेतले') || lower.includes('खा ली') || lower.includes('ले ली') || lower.includes('घेतलं')
    ) && (
      lower.includes('med') || lower.includes('dawai') || lower.includes('goli') || lower.includes('aushadh') ||
      lower.includes('दवाई') || lower.includes('औषध') || lower.includes('गोळी') ||
      medicines.some(m => lower.includes(m.name.toLowerCase()))
    )

    if (isMarkTaken) {
      setThinkingTip(activeLang === 'hi' ? 'दवाइयों की जाँच हो रही है...' : activeLang === 'mr' ? 'औषधांची तपासणी करत आहे...' : 'Checking active prescriptions...')
      const targetMed = medicines.find(m => lower.includes(m.name.toLowerCase())) || medicines.find(m => m.status === 'pending')
      if (targetMed) {
        if (onUpdateStatus) {
          try { await onUpdateStatus(targetMed.id, 'taken') } catch(e) {}
        }
        const confirmSpeech = activeLang === 'hi'
          ? `शाबाश! मैंने ${targetMed.name} को ली गई दवा के रूप में चिह्नित कर दिया है।`
          : activeLang === 'mr'
          ? `छान काम! मी ${targetMed.name} हे औषध घेतले म्हणून नोंदवले आहे.`
          : `Wonderful job! I have marked ${targetMed.name} as taken.`

        speakText(confirmSpeech)
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: activeLang === 'hi'
              ? `बहुत अच्छा! मैंने आपके डैशबोर्ड पर ${targetMed.name} की खुराक पूर्ण कर दी है:`
              : activeLang === 'mr'
              ? `उत्तम! मी तुमच्या डॅशबोर्डवर ${targetMed.name} औषधाची नोंद पूर्ण केली आहे:`
              : `Wonderful job! I have updated your dashboard adherence tracker:`,
            card: {
              type: 'taken_success',
              data: {
                name: targetMed.name,
                dosage: targetMed.dosage || '1 dose',
                time: targetMed.times ? targetMed.times.join(', ') : targetMed.time || 'Daily'
              }
            }
          }])
          setLoading(false)
        }, 500)
        return
      }
    }

    // ── 2. Log Water Intake ──
    const isWaterLog = (
      lower.includes('water') || lower.includes('pani') || lower.includes('paani') || lower.includes('drank') ||
      lower.includes('drink') || lower.includes('पानी') || lower.includes('पाणी')
    ) && (
      lower.includes('add') || lower.includes('log') || lower.includes('drank') || lower.includes('glass') ||
      lower.includes('ml') || lower.includes('piya') || lower.includes('had') || lower.includes('pyalo') ||
      lower.includes('pyale') || lower.includes('पिया') || lower.includes('प्यालो') || lower.includes('प्याले')
    )

    if (isWaterLog) {
      setThinkingTip(activeLang === 'hi' ? 'पानी का स्तर अपडेट किया जा रहा है...' : activeLang === 'mr' ? 'पाण्याची नोंद अद्ययावत करत आहे...' : 'Updating hydration balance...')
      const ml = parseWaterIntake(msg) || 250
      let newTotal = null
      if (onAddWater) {
        try { newTotal = await onAddWater(ml) } catch(e) {}
      }
      const currentTotal = newTotal || (localWater + ml)
      const pct = Math.min(Math.round((currentTotal / waterGoal) * 100), 100)

      const speechMsg = activeLang === 'hi'
        ? `${ml} मिलीलीटर पानी दर्ज किया गया। बहुत बढ़िया!`
        : activeLang === 'mr'
        ? `${ml} मिलीलीटर पाण्याची नोंद झाली. अभिनंदन!`
        : `Recorded ${ml} milliliters of water. Great job staying hydrated!`

      speakText(speechMsg)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: activeLang === 'hi'
            ? `पानी का सेवन दर्ज हो गया! पर्याप्त पानी पीने से दवाइयों का अवशोषण और किडनी का स्वास्थ्य बेहतर रहता है।`
            : activeLang === 'mr'
            ? `पाण्याची नोंद यशस्वी झाली! पुरेसे पाणी प्यायल्याने औषधांचे योग्य शोषण होते आणि आरोग्य चांगले राहते.`
            : `Hydration recorded! Staying consistently hydrated promotes better drug absorption and kidney health.`,
          card: {
            type: 'water',
            data: {
              amount: ml,
              total: currentTotal,
              goal: waterGoal,
              percent: pct
            }
          }
        }])
        setLoading(false)
      }, 500)
      return
    }

    // ── 3. Schedule New Medicine ──
    const isMedAdd = (
      lower.includes('add') || lower.includes('schedule') || lower.includes('remind') || lower.includes('take') ||
      lower.includes('start') || lower.includes('nayi dawai') || lower.includes('जोड़ो') || lower.includes('जोड़ा') ||
      lower.includes('जोडा') || lower.includes('नवीन औषध')
    ) && (
      lower.includes('med') || lower.includes('tablet') || lower.includes('pill') || lower.includes('dawai') ||
      lower.includes('goli') || lower.includes('mg') || lower.includes('dose') || lower.includes('दवाई') ||
      lower.includes('औषध') || lower.includes('गोळी')
    )

    if (isMedAdd) {
      setThinkingTip(activeLang === 'hi' ? 'दवा की खुराक और समय निर्धारित हो रहा है...' : activeLang === 'mr' ? 'औषधाची वेळ व डोस तपासत आहे...' : 'Analyzing dosage, frequency & meal timing...')
      const medData = parseMedicineSchedule(msg)
      if (medData) {
        if (onAddMedicine) {
          try {
            await onAddMedicine({
              ...medData,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            })
          } catch(e) {}
        }

        const addSpeech = activeLang === 'hi'
          ? `${medData.name} ${medData.dosage} का रिमाइंडर निर्धारित कर दिया गया है।`
          : activeLang === 'mr'
          ? `${medData.name} ${medData.dosage} चे स्मरणपत्र सेट केले आहे.`
          : `Scheduled ${medData.name} ${medData.dosage} with reminders.`

        speakText(addSpeech)
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: activeLang === 'hi'
              ? `मैंने आपकी दवा का रिमाइंडर सेट कर दिया है। विवरण नीचे दिया गया है:`
              : activeLang === 'mr'
              ? `मी तुमच्या औषधाचे रिमाइंडर वेळापत्रक तयार केले आहे. तपशील खालीलप्रमाणे:`
              : `I have scheduled your medicine with reminders. Here are the confirmed details:`,
            card: {
              type: 'medicine',
              data: {
                name: medData.name,
                dosage: medData.dosage,
                times: medData.times,
                foodTiming: medData.foodTiming,
                duration: medData.duration
              }
            }
          }])
          setLoading(false)
        }, 600)
        return
      }
    }

    // ── 4. Medicine List & Schedule Inquiries ──
    if (
      lower.includes('my medicine') || lower.includes('what medicine') || lower.includes('scheduled medicine') ||
      lower.includes('my dawai') || lower.includes('meds list') || lower.includes('aushadh') || lower.includes('list') ||
      lower.includes('मेरी दवाई') || lower.includes('माझी औषधे') || lower.includes('दवाइयों की सूची') || lower.includes('औषधांची यादी')
    ) {
      setThinkingTip(activeLang === 'hi' ? 'दवाइयों की सूची प्राप्त हो रही है...' : activeLang === 'mr' ? 'औषधांची यादी लोड होत आहे...' : 'Fetching your active prescription routine...')
      setTimeout(() => {
        if (!medicines || medicines.length === 0) {
          const emptyResp = activeLang === 'hi'
            ? "वर्तमान में आपकी कोई निर्धारित दवाई नहीं है। आप मुझे नई दवाई जोड़ने के लिए कह सकते हैं।"
            : activeLang === 'mr'
            ? "सध्या तुमचे कोणतेही औषध नियोजित नाही. तुम्ही मला नवीन औषध जोडण्यास सांगू शकता."
            : "You currently have no scheduled medicines. You can ask me to add one anytime."

          speakText(emptyResp)
          setMessages(prev => [...prev, { role: 'bot', text: emptyResp }])
        } else {
          const listSpeech = activeLang === 'hi'
            ? `आपके पास ${medicines.length} निर्धारित दवाइयाँ हैं।`
            : activeLang === 'mr'
            ? `तुमच्याकडे ${medicines.length} नियोजित औषधे आहेत.`
            : `You have ${medicines.length} active medicines scheduled.`

          speakText(listSpeech)
          setMessages(prev => [...prev, {
            role: 'bot',
            text: activeLang === 'hi'
              ? `यह रही आपकी सक्रिय दवाई अनुसूची (${medicines.length} दवाइयाँ):`
              : activeLang === 'mr'
              ? `हे आहे तुमचे औषध वेळापत्रक (${medicines.length} औषधे):`
              : `Here is your active medication schedule (${medicines.length} medicine${medicines.length > 1 ? 's' : ''}):`,
            card: {
              type: 'medicine_list',
              data: { medicines }
            }
          }])
        }
        setLoading(false)
      }, 400)
      return
    }

    // ── 5. BMI Inquiry & Calculation ──
    if (
      lower.includes('bmi') || lower.includes('body mass') || lower.includes('mera bmi') ||
      lower.includes('weight status') || lower.includes('vajan') || lower.includes('वजन') || lower.includes('उंची') || lower.includes('ऊंचाई')
    ) {
      setThinkingTip(activeLang === 'hi' ? 'बीएमआई और वजन का विश्लेषण हो रहा है...' : activeLang === 'mr' ? 'बीएमआय व वजनाचे विश्लेषण करत आहे...' : 'Evaluating Body Mass Index & health range...')
      const hMatch = lower.match(/(?:height|h|उंचाई|ऊंचाई|उंची)\s*(?:is|:|=|आहे|है)?\s*(\d+(?:\.\d+)?)\s*(cm|ft|feet|in)?/i) || lower.match(/(\d{2,3})\s*cm/i)
      const wMatch = lower.match(/(?:weight|w|wt|वजन)\s*(?:is|:|=|आहे|है)?\s*(\d+(?:\.\d+)?)\s*(kg|kgs|lbs|pound)?/i) || lower.match(/(\d{2,3})\s*kg/i)

      let calcH = hMatch ? parseFloat(hMatch[1]) : (userProfile?.height ? parseFloat(userProfile.height) : null)
      let calcW = wMatch ? parseFloat(wMatch[1]) : (userProfile?.weight ? parseFloat(userProfile.weight) : null)

      if (calcH && calcW) {
        if (calcH <= 8.5) calcH = calcH * 30.48
        const hm = calcH / 100
        const calcB = (calcW / (hm * hm)).toFixed(1)
        const numB = parseFloat(calcB)
        const cat = numB < 18.5
          ? (activeLang === 'hi' ? 'कम वजन (<18.5)' : activeLang === 'mr' ? 'कमी वजन (<18.5)' : 'Underweight (<18.5)')
          : numB < 25
          ? (activeLang === 'hi' ? 'सामान्य व स्वस्थ वजन (18.5–24.9)' : activeLang === 'mr' ? 'सामान्य व निरोगी वजन (18.5–24.9)' : 'Normal / Healthy Weight (18.5–24.9)')
          : numB < 30
          ? (activeLang === 'hi' ? 'अधिक वजन (25–29.9)' : activeLang === 'mr' ? 'जास्त वजन (25–29.9)' : 'Overweight (25–29.9)')
          : (activeLang === 'hi' ? 'मोटापा (≥30)' : activeLang === 'mr' ? 'लठ्ठपणा (≥30)' : 'Obese (≥30)')

        const color = numB < 18.5 ? '#38bdf8' : numB < 25 ? '#00c48c' : numB < 30 ? '#fbbf24' : '#ff4d6a'
        const minW = (18.5 * hm * hm).toFixed(1)
        const maxW = (24.9 * hm * hm).toFixed(1)

        const bmiSpeech = activeLang === 'hi'
          ? `आपका बीएमआई ${calcB} है, जो ${cat} श्रेणी में आता है। आपकी ऊंचाई के लिए स्वस्थ वजन ${minW} से ${maxW} किलोग्राम है।`
          : activeLang === 'mr'
          ? `तुमचा बीएमआय ${calcB} आहे, जे ${cat} श्रेणीत येते. तुमच्या उंचीसाठी निरोगी वजन ${minW} ते ${maxW} किलो आहे.`
          : `Your BMI is ${calcB}, which falls in the ${cat} range. Healthy weight for your height is ${minW} to ${maxW} kilograms.`

        speakText(bmiSpeech)
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: activeLang === 'hi'
              ? `यहाँ आपका संपूर्ण बीएमआई स्वास्थ्य मूल्यांकन है:`
              : activeLang === 'mr'
              ? `येथे तुमचे संपूर्ण बीएमआय आरोग्य मूल्यांकन आहे:`
              : `Here is your comprehensive BMI assessment:`,
            card: {
              type: 'bmi',
              data: {
                bmi: calcB,
                height: Math.round(calcH),
                weight: calcW,
                category: cat,
                color,
                idealRange: `${minW} kg – ${maxW} kg`
              }
            }
          }])
          setLoading(false)
        }, 450)
        return
      } else {
        const askBmi = activeLang === 'hi'
          ? "बीएमआई की गणना के लिए, अपनी ऊंचाई और वजन बताएं! उदाहरण: 'ऊंचाई 170cm वजन 65kg का BMI बताओ'."
          : activeLang === 'mr'
          ? "बीएमआय काढण्यासाठी तुमची उंची आणि वजन सांगा! उदाहरण: 'उंची 170cm वजन 65kg बीएमआय काढा'."
          : "To calculate your BMI, tell me your height and weight! For example: Calculate BMI for height 170cm and weight 65kg."

        speakText(askBmi)
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'bot', text: askBmi }])
          setLoading(false)
        }, 400)
        return
      }
    }

    // ── 6. Smart AI Medical Advice for ANY Question ──
    setThinkingTip(activeLang === 'hi' ? 'उत्तर तैयार किया जा रहा है...' : activeLang === 'mr' ? 'उत्तर तयार करत आहे...' : 'Generating medical advice...')
    
    try {
      const userContext = { totalMeds, waterIntake: localWater, waterGoal }
      const aiReply = await generateSmartAIResponse(msg, activeLang, userContext)
      speakText(aiReply)
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', text: aiReply }])
        setLoading(false)
      }, 400)
    } catch(err) {
      console.error('AI generation error:', err)
      const errReply = activeLang === 'hi'
        ? `मुझे आपका सवाल समझने में कुछ परेशानी हुई। कृपया अपनी समस्या दोबारा पूछें।`
        : activeLang === 'mr'
        ? `मला तुमचा प्रश्न समजण्यात अडचण आली. कृपया तुमचा प्रश्न पुन्हा विचारा.`
        : `I had trouble processing that. Please try rephrasing your health question.`
      speakText(errReply)
      setMessages(prev => [...prev, { role: 'bot', text: errReply }])
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── HEADER ── */}
      <div className="greeting s1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2>{activeLang === 'hi' ? 'AI वॉयस और स्वास्थ्य सहायक 🤖🎙️' : activeLang === 'mr' ? 'AI व्हॉईस आणि आरोग्य सहाय्यक 🤖🎙️' : 'AI Voice & Health Assistant 🤖🎙️'}</h2>
          <p>{activeLang === 'hi' ? 'अंग्रेजी, हिंदी या मराठी में कोई भी सवाल पूछें या बोलें' : activeLang === 'mr' ? 'इंग्रजी, हिंदी किंवा मराठीत कोणताही प्रश्न विचारा अथवा बोला' : 'Ask any health question in English, Hindi, or Marathi'}</p>
        </div>

        {/* Voice controls & Language selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={voiceLang}
            onChange={e => setVoiceLang(e.target.value)}
            style={{
              background: 'rgba(26,111,255,0.08)', border: '1px solid rgba(26,111,255,0.2)',
              color: 'var(--blue)', padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--ff)', outline: 'none'
            }}
          >
            <option value="en-IN">🇬🇧 English (IN)</option>
            <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
            <option value="mr-IN">🇮🇳 मराठी (Marathi)</option>
          </select>

          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled)
              if (voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel()
            }}
            title={voiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
            style={{
              background: voiceEnabled ? 'rgba(0,196,140,0.1)' : 'rgba(255,77,106,0.1)',
              border: `1px solid ${voiceEnabled ? 'rgba(0,196,140,0.25)' : 'rgba(255,77,106,0.25)'}`,
              color: voiceEnabled ? 'var(--success)' : 'var(--danger)',
              padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700
            }}
          >
            {voiceEnabled ? (activeLang === 'hi' ? '🔊 आवाज़ चालू' : activeLang === 'mr' ? '🔊 आवाज सुरू' : '🔊 Voice On') : (activeLang === 'hi' ? '🔇 म्यूट' : activeLang === 'mr' ? '🔇 म्यूट' : '🔇 Voice Off')}
          </button>
        </div>
      </div>

      {/* ── QUICK ACTION CHIPS ── */}
      <div className="chips s2" style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
        {dynamicChips.map((q, i) => (
          <button key={i} className="chip" onClick={() => handleUserMessage(q)} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
            {q}
          </button>
        ))}
      </div>

      {/* ── CHAT CONTAINER ── */}
      <div className="card s3" style={{ flex: 1, display:'flex', flexDirection:'column', padding:'16px 20px' }}>
        <div className="chat-wrap" style={{ display:'flex', flexDirection:'column', height:'56vh' }}>
          <div className="chat-messages" style={{ flex:1, overflowY:'auto', paddingRight:6 }}>
            {messages.map((m, i) => (
              <div key={i} className={'chat-bubble ' + m.role} style={{ lineHeight:1.5, marginBottom:14, padding:'14px 18px' }}>
                {m.role === 'bot' && (
                  <div className="bot-label" style={{ fontWeight:800, marginBottom:6, color:'var(--blue)', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
                    🤖 {activeLang === 'hi' ? 'सेवार्थी AI' : activeLang === 'mr' ? 'सेवार्थी AI' : 'Sewaarthi AI'}
                    <span style={{ fontSize:10, background:'rgba(26,111,255,0.1)', padding:'2px 6px', borderRadius:6, color:'var(--blue)', fontWeight:600 }}>Active Care</span>
                  </div>
                )}

                {/* Formatted Text */}
                <FormattedText text={m.text} />

                {/* ── 1. Daily Briefing Card ── */}
                {m.card && m.card.type === 'daily_briefing' && (
                  <div style={{ background:'linear-gradient(135deg, rgba(26,111,255,0.08) 0%, rgba(56,189,248,0.06) 100%)', border:'1.5px solid rgba(26,111,255,0.2)', borderRadius:18, padding:'16px 18px', marginTop:12 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'var(--blue)', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>⚡ {activeLang === 'hi' ? 'दैनिक स्वास्थ्य सारांश' : activeLang === 'mr' ? 'दैनंदिन आरोग्य सारांश' : 'Real-Time Health Summary'}</span>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>{today}</span>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                      <div style={{ background:'rgba(255,255,255,0.85)', padding:'10px 12px', borderRadius:12, border:'1px solid rgba(26,111,255,0.12)' }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>💊 {activeLang === 'hi' ? 'दवाइयाँ' : activeLang === 'mr' ? 'औषधे' : 'MEDICATIONS'}</div>
                        <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginTop:2 }}>
                          {m.card.data.takenMeds} / {m.card.data.totalMeds} {activeLang === 'hi' ? 'ली गईं' : activeLang === 'mr' ? 'घेतले' : 'taken'}
                        </div>
                        <div style={{ fontSize:11, color: m.card.data.pendingMeds > 0 ? 'var(--warning)' : 'var(--success)', fontWeight:600, marginTop:2 }}>
                          {m.card.data.pendingMeds > 0
                            ? `${m.card.data.pendingMeds} ${activeLang === 'hi' ? 'बाकी' : activeLang === 'mr' ? 'बाकी' : 'pending'}`
                            : (activeLang === 'hi' ? 'सभी ली गईं! ✅' : activeLang === 'mr' ? 'सर्व घेतले! ✅' : 'All taken! ✅')}
                        </div>
                      </div>

                      <div style={{ background:'rgba(255,255,255,0.85)', padding:'10px 12px', borderRadius:12, border:'1px solid rgba(56,189,248,0.2)' }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>💧 {activeLang === 'hi' ? 'पानी का स्तर' : activeLang === 'mr' ? 'पाण्याचे प्रमाण' : 'HYDRATION'}</div>
                        <div style={{ fontSize:15, fontWeight:800, color:'#0284c7', marginTop:2 }}>
                          {m.card.data.waterIntake} ml
                        </div>
                        <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginTop:2 }}>
                          {m.card.data.waterPercent}% / {m.card.data.waterGoal}ml
                        </div>
                      </div>
                    </div>

                    {m.card.data.nextMed && (
                      <div style={{ background:'rgba(26,111,255,0.06)', borderRadius:12, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px dashed rgba(26,111,255,0.2)' }}>
                        <div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>{activeLang === 'hi' ? 'आगामी खुराक:' : activeLang === 'mr' ? 'पुढील डोस:' : 'Upcoming Dose:'}</div>
                          <strong style={{ fontSize:13, color:'var(--text)' }}>💊 {m.card.data.nextMed.name}</strong> ({m.card.data.nextMed.dosage})
                        </div>
                        <span style={{ background:'var(--blue)', color:'#fff', padding:'4px 8px', borderRadius:8, fontSize:11, fontWeight:700 }}>
                          ⏰ {m.card.data.nextMed.times ? m.card.data.nextMed.times[0] : m.card.data.nextMed.time}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 2. Medicine Scheduled Card ── */}
                {m.card && m.card.type === 'medicine' && (
                  <div style={{ background:'rgba(26,111,255,0.06)', border:'1.5px solid rgba(26,111,255,0.2)', borderRadius:16, padding:'14px 16px', marginTop:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:22 }}>💊</span>
                        <strong style={{ fontSize:16, color:'var(--text)' }}>{m.card.data.name}</strong>
                      </div>
                      <span style={{ background:'var(--blue)', color:'#fff', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700 }}>
                        {m.card.data.dosage}
                      </span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, color:'var(--text2)', marginBottom:8 }}>
                      <div>⏰ <strong>{activeLang === 'hi' ? 'समय:' : activeLang === 'mr' ? 'वेळ:' : 'Time:'}</strong> {m.card.data.times.join(', ')}</div>
                      <div>🍽️ <strong>{activeLang === 'hi' ? 'भोजन:' : activeLang === 'mr' ? 'अन्न:' : 'Timing:'}</strong> {m.card.data.foodTiming === 'before' ? (activeLang === 'hi' ? 'खाने से पहले' : activeLang === 'mr' ? 'जेवणापूर्वी' : 'Before food') : m.card.data.foodTiming === 'with' ? (activeLang === 'hi' ? 'खाने के साथ' : activeLang === 'mr' ? 'जेवणासह' : 'With food') : (activeLang === 'hi' ? 'खाने के बाद' : activeLang === 'mr' ? 'जेवणानंतर' : 'After food')}</div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, paddingTop:8, borderTop:'1px dashed rgba(26,111,255,0.18)', color:'var(--success)', fontWeight:700 }}>
                      <span>✅ {activeLang === 'hi' ? 'रिमाइंडर सक्रिय' : activeLang === 'mr' ? 'रिमाइंडर सक्रिय' : 'Scheduled & Reminders Active'}</span>
                      <span style={{ color:'var(--text3)', fontWeight:500 }}>{m.card.data.duration} {activeLang === 'hi' ? 'दिन' : activeLang === 'mr' ? 'दिवस' : 'days'}</span>
                    </div>
                  </div>
                )}

                {/* ── 3. Medicine Marked Taken Card ── */}
                {m.card && m.card.type === 'taken_success' && (
                  <div style={{ background:'rgba(0,196,140,0.08)', border:'1.5px solid rgba(0,196,140,0.25)', borderRadius:16, padding:'14px 16px', marginTop:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ fontSize:26 }}>🎉</div>
                      <div>
                        <strong style={{ fontSize:15, color:'var(--success)' }}>{activeLang === 'hi' ? 'खुराक ली गई पुष्टि हुई!' : activeLang === 'mr' ? 'डोस घेतल्याची पुष्टी झाली!' : 'Dose Confirmed Taken!'}</strong>
                        <div style={{ fontSize:12, color:'var(--text)', marginTop:2 }}>
                          {m.card.data.name} ({m.card.data.dosage}) · {m.card.data.time}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 4. Water Log Card ── */}
                {m.card && m.card.type === 'water' && (
                  <div style={{ background:'rgba(56,189,248,0.08)', border:'1.5px solid rgba(56,189,248,0.25)', borderRadius:16, padding:'14px 16px', marginTop:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:22 }}>💧</span>
                        <strong style={{ fontSize:15, color:'#0284c7' }}>
                          {m.card.data.amount > 0 ? `+${m.card.data.amount}ml ${activeLang === 'hi' ? 'पानी दर्ज हुआ' : activeLang === 'mr' ? 'पाणी नोंदवले' : 'Water Logged'}` : (activeLang === 'hi' ? 'जल ट्रैकर' : activeLang === 'mr' ? 'पाणी ट्रॅकर' : 'Hydration Tracker')}
                        </strong>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:'#0284c7' }}>{m.card.data.total}ml</span>
                    </div>
                    <div style={{ height:8, background:'rgba(56,189,248,0.2)', borderRadius:99, overflow:'hidden', marginTop:6 }}>
                      <div style={{ height:'100%', width:`${m.card.data.percent}%`, background:'linear-gradient(90deg,#38bdf8,#1a6fff)', borderRadius:99, transition:'width 0.4s ease' }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginTop:6, fontWeight:600 }}>
                      <span>{activeLang === 'hi' ? 'दैनिक लक्ष्य:' : activeLang === 'mr' ? 'दैनंदिन उद्दिष्ट:' : 'Daily Goal:'} {m.card.data.goal}ml</span>
                      <span style={{ color:'var(--blue)' }}>{m.card.data.percent}% {activeLang === 'hi' ? 'पूर्ण' : activeLang === 'mr' ? 'पूर्ण' : 'Completed'}</span>
                    </div>
                  </div>
                )}

                {/* ── 5. BMI Metric Card ── */}
                {m.card && m.card.type === 'bmi' && (
                  <div style={{ background:'rgba(26,111,255,0.05)', border:'1.5px solid rgba(26,111,255,0.18)', borderRadius:16, padding:'14px 16px', marginTop:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:22 }}>⚖️</span>
                        <strong style={{ fontSize:15, color:'var(--text)' }}>{activeLang === 'hi' ? 'बीएमआई मूल्यांकन' : activeLang === 'mr' ? 'बीएमआय मूल्यांकन' : 'BMI Assessment'}</strong>
                      </div>
                      <span style={{ fontSize:18, fontWeight:800, color: m.card.data.color, fontFamily:'var(--fh)' }}>
                        {m.card.data.bmi}
                      </span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, color:'var(--text2)', marginBottom:8 }}>
                      <div>📏 {activeLang === 'hi' ? 'ऊंचाई:' : activeLang === 'mr' ? 'उंची:' : 'Height:'} <strong>{m.card.data.height} cm</strong></div>
                      <div>⚖️ {activeLang === 'hi' ? 'वजन:' : activeLang === 'mr' ? 'वजन:' : 'Weight:'} <strong>{m.card.data.weight} kg</strong></div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.8)', padding:'8px 12px', borderRadius:10, fontSize:12, fontWeight:700, color: m.card.data.color, marginBottom:6 }}>
                      {m.card.data.category}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>
                      🎯 {activeLang === 'hi' ? 'स्वस्थ वजन सीमा:' : activeLang === 'mr' ? 'निरोगी वजन मर्यादा:' : 'Healthy Weight Range:'} <strong>{m.card.data.idealRange}</strong>
                    </div>
                  </div>
                )}

                {/* ── 6. Medicine List Card ── */}
                {m.card && m.card.type === 'medicine_list' && (
                  <div style={{ background:'rgba(26,111,255,0.04)', border:'1.5px solid rgba(26,111,255,0.15)', borderRadius:16, padding:'14px 16px', marginTop:10 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--blue)', marginBottom:10 }}>
                      📋 {activeLang === 'hi' ? 'सक्रिय दवाइयाँ' : activeLang === 'mr' ? 'सक्रिय औषधे' : 'Active Prescriptions'} ({m.card.data.medicines.length})
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {m.card.data.medicines.map((med, mi) => (
                        <div key={mi} style={{ background:'#fff', padding:'10px 12px', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(26,111,255,0.1)' }}>
                          <div>
                            <strong style={{ fontSize:13, color:'var(--text)' }}>💊 {med.name}</strong>
                            <div style={{ fontSize:11, color:'var(--text3)' }}>
                              {med.dosage} · ⏰ {med.times ? med.times.join(', ') : med.time} · {med.foodTiming} food
                            </div>
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color: med.status === 'taken' ? 'var(--success)' : 'var(--warning)', background: med.status === 'taken' ? 'rgba(0,196,140,0.1)' : 'rgba(251,191,36,0.1)', padding:'3px 8px', borderRadius:6 }}>
                            {med.status === 'taken' ? (activeLang === 'hi' ? 'ली गई' : activeLang === 'mr' ? 'घेतले' : 'Taken') : (activeLang === 'hi' ? 'बाकी' : activeLang === 'mr' ? 'बाकी' : 'Pending')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble bot" style={{ padding:'12px 18px', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ animation:'spin 1s linear infinite', fontSize:16 }}>⏳</span>
                <span style={{ fontSize:13, color:'var(--text2)', fontWeight:600 }}>
                  {thinkingTip || (activeLang === 'hi' ? 'AI सोच रहा है...' : activeLang === 'mr' ? 'AI विचार करत आहे...' : 'AI is thinking...')}
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* ── CHAT INPUT BAR ── */}
          <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:12, paddingTop:10, borderTop:'1px solid rgba(26,111,255,0.1)' }}>
            <input
              type="text"
              className="form-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUserMessage()}
              placeholder={activeLang === 'hi' ? 'कोई भी स्वास्थ्य सवाल पूछें (उदा. सर्दी के उपाय, बीपी में क्या खाएं, सिरदर्द)...' : activeLang === 'mr' ? 'कोणताही आरोग्य प्रश्न विचारा (उदा. सर्दीवर उपाय, बीपीत काय खावे, डोकेदुखी)...' : 'Ask any health question (e.g. cold relief, BP diet, headache)...'}
              style={{ flex:1, margin:0, padding:'12px 16px' }}
            />

            {/* Voice Mic Button */}
            <button
              onClick={toggleListening}
              title={isListening ? 'Listening...' : 'Tap to Speak'}
              style={{
                width:46, height:46, borderRadius:14, border:'none',
                background: isListening ? 'linear-gradient(135deg,#ff4d6a,#ff758c)' : 'rgba(26,111,255,0.08)',
                color: isListening ? '#fff' : 'var(--blue)',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20, flexShrink:0, transition:'all 0.2s',
                boxShadow: isListening ? '0 0 16px rgba(255,77,106,0.5)' : 'none',
                animation: isListening ? 'pulse 1.2s infinite' : 'none'
              }}
            >
              🎙️
            </button>

            {/* Send Button */}
            <button
              className="btn btn-primary"
              onClick={() => handleUserMessage()}
              disabled={loading || !input.trim()}
              style={{ padding:'12px 20px', borderRadius:14, flexShrink:0 }}
            >
              {activeLang === 'hi' ? 'भेजें' : activeLang === 'mr' ? 'पाठवा' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}