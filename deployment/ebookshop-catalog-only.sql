-- GM eBookshop: catalog-only initialization for a NEW EMPTY selected database.
-- Creates three tables and restores 30 public catalog books only.
-- No customer orders, staff accounts, passwords, drops, or server settings.
-- Never import over an existing database; preserve its data separately.

CREATE TABLE `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(50) NOT NULL,
  `author` varchar(50) NOT NULL,
  `price` float NOT NULL,
  `qty` int NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `qty_ordered` int NOT NULL,
  `cust_name` varchar(100) NOT NULL,
  `cust_email` varchar(150) NOT NULL,
  `cust_phone` varchar(20) NOT NULL,
  `book_id` int DEFAULT NULL,
  `book_title` varchar(255) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `books` VALUES (1,'A Tale of Two Cities','Charles Dickens',12.5,6,'A masterpiece of historical fiction, this tale takes you through the tumultuous times of the French Revolution. Experience love, sacrifice, and redemption as two men\'s fates intertwine in the shadow of the guillotine.'),(2,'The Great Gatsby','F. Scott Fitzgerald',15.99,7,'Enter the glittering world of the Jazz Age where dreams and disillusionment dance together. Follow the mysterious Jay Gatsby as he pursues his impossible dream through lavish parties and tragic romance.'),(3,'To Kill a Mockingbird','Harper Lee',10,13,'A powerful story of racial injustice and childhood innocence in the American South. Through Scout Finch\'s eyes, witness her father Atticus defend a Black man falsely accused of a terrible crime.'),(4,'1984','George Orwell',14.5,12,'A chilling vision of totalitarian rule where Big Brother watches everything. Winston Smith struggles to maintain his humanity in a world where truth is controlled and history is rewritten.'),(5,'Pride and Prejudice','Jane Austen',9.99,20,'Wit, romance, and social commentary intertwine in this beloved classic. Elizabeth Bennet must navigate the treacherous waters of Georgian society while confronting her own prejudices.'),(6,'The Catcher in the Rye','J.D. Salinger',11.75,7,'Follow Holden Caulfield through New York City as he grapples with adolescent angst and alienation. His distinctive voice captures the confusion and rebellion of teenage years.'),(7,'Moby Dick','Herman Melville',13.25,1,'An epic tale of obsession and revenge on the high seas. Captain Ahab\'s monomaniacal pursuit of the white whale Moby Dick becomes a profound meditation on fate, free will, and the nature of evil.'),(8,'War and Peace','Leo Tolstoy',18,5,'A sweeping saga of Russian society during the Napoleonic era. Follow the interwoven lives of aristocratic families as they navigate love, war, and philosophical questions about life\'s meaning.'),(9,'Oliver Twist','Charles Dickens',8.99,13,'A gripping tale of a young orphan boy navigating the dark streets of Victorian London, encountering criminals and kind strangers alike in his search for identity and belonging.'),(10,'Great Expectations','Charles Dickens',11.5,9,'The semi-autobiographical story of David Copperfield\'s journey from a difficult childhood to becoming a successful writer, filled with unforgettable characters.'),(11,'David Copperfield','Charles Dickens',13,10,'Charles Dickens\' most personal novel, following young David through poverty, love, and ultimately triumph in Victorian England.'),(12,'The Tender Night','F. Scott Fitzgerald',10.25,6,'A haunting story of love and loss on the French Riviera, exploring the lives of expatriates living glamorously but destructively in 1920s Europe.'),(13,'This Side of Paradise','F. Scott Fitzgerald',9.75,13,'Fitzgerald\'s debut novel follows the idealistic Amory Blaine through Princeton and early adulthood, searching for identity and meaning in post-WWI America.'),(14,'The Beautiful and Damned','F. Scott Fitzgerald',12,8,'A portrait of the beautiful and self-destructive Anthony Patch and his wife Gloria, whose lives unravel as they wait to inherit a fortune.'),(15,'Go Set a Watchman','Harper Lee',14.99,10,'Scout Finch, now an adult, returns to Maycomb and confronts painful truths about her father Atticus and the community she thought she knew.'),(16,'Summertime','Harper Lee',7.5,18,'A lyrical novel set in South Africa, exploring themes of memory, identity, and the legacy of apartheid through interconnected stories.'),(17,'The Mockingbird Next Door','Harper Lee',11.25,5,'A journalist\'s intimate portrait of Harper Lee herself, exploring the reclusive author\'s life in her hometown of Monroeville, Alabama.'),(18,'Animal Farm','George Orwell',8.5,21,'A short but powerful allegorical novella in which farm animals overthrow their human farmer, only to find their new leaders just as corrupt.'),(19,'Homage to Catalonia','George Orwell',10.75,8,'Orwell\'s personal account of fighting in the Spanish Civil War, offering a raw and honest look at political disillusionment and the chaos of war.'),(20,'Burmese Days','George Orwell',9.25,13,'Set in colonial Burma, this novel follows a British police officer tormented by his role as an enforcer of imperial rule, torn between duty and conscience.'),(21,'Sense and Sensibility','Jane Austen',8.99,17,'Two sisters navigate love and marriage in Regency England, with the impulsive Marianne contrasting sharply with the reserved and sensible Elinor.'),(22,'Emma','Jane Austen',10.5,12,'A witty and warm portrait of Emma Woodhouse, a young woman convinced of her matchmaking skills but blind to the feelings around — and within — her.'),(23,'Persuasion','Jane Austen',7.99,25,'Austen\'s final completed novel follows Anne Elliot as she reconnects with Captain Wentworth years after being persuaded to break off their engagement.'),(24,'Franny and Zooey','J.D. Salinger',9.5,11,'Two novellas exploring spiritual searching and the quest for authenticity among young New Yorkers in the 1950s, written with Salinger\'s signature wit.'),(25,'Nine Stories','J.D. Salinger',8.75,7,'A celebrated collection of short stories showcasing Salinger\'s mastery of character and voice, including the iconic story A Perfect Day for Bananafish.'),(26,'Raise High the Roof Beam','J.D. Salinger',10,6,'A novella and short story collection centered on the Glass family, exploring themes of spiritual enlightenment and the burden of exceptional intelligence.'),(27,'Billy Budd','Herman Melville',7.25,9,'A short novel written after Melville\'s death, telling the story of a young sailor\'s unjust accusation aboard a warship, a meditation on innocence and injustice.'),(28,'Typee','Herman Melville',8.5,13,'Melville\'s debut novel, a lightly fictionalized account of his own experiences living among the indigenous people of the Marquesas Islands.'),(29,'Pierre','Herman Melville',11,0,'A challenging and ambitious novel following Pierre Glendinning as he abandons his privileged life for a doomed pursuit of idealism and artistic truth.'),(30,'Anna Karenina','Leo Tolstoy',16.5,7,'Tolstoy\'s sweeping portrait of Russian aristocratic society, following Anna\'s tragic love affair against the backdrop of 19th-century social expectations.');

SELECT COUNT(*) AS catalog_books FROM books;
SELECT COUNT(*) AS customer_orders FROM order_records;
SELECT COUNT(*) AS staff_accounts FROM users;
