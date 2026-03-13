-- MySQL dump 10.13  Distrib 9.6.0, for macos15 (arm64)
--
-- Host: localhost    Database: ebookshop
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '6f4b9ed0-0885-11f1-bb67-44bce33d86e7:1-88';

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(50) NOT NULL,
  `author` varchar(50) NOT NULL,
  `price` float NOT NULL,
  `qty` int NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (1,'A Tale of Two Cities','Charles Dickens',12.5,6,'A masterpiece of historical fiction, this tale takes you through the tumultuous times of the French Revolution. Experience love, sacrifice, and redemption as two men\'s fates intertwine in the shadow of the guillotine.'),(2,'The Great Gatsby','F. Scott Fitzgerald',15.99,7,'Enter the glittering world of the Jazz Age where dreams and disillusionment dance together. Follow the mysterious Jay Gatsby as he pursues his impossible dream through lavish parties and tragic romance.'),(3,'To Kill a Mockingbird','Harper Lee',10,13,'A powerful story of racial injustice and childhood innocence in the American South. Through Scout Finch\'s eyes, witness her father Atticus defend a Black man falsely accused of a terrible crime.'),(4,'1984','George Orwell',14.5,12,'A chilling vision of totalitarian rule where Big Brother watches everything. Winston Smith struggles to maintain his humanity in a world where truth is controlled and history is rewritten.'),(5,'Pride and Prejudice','Jane Austen',9.99,20,'Wit, romance, and social commentary intertwine in this beloved classic. Elizabeth Bennet must navigate the treacherous waters of Georgian society while confronting her own prejudices.'),(6,'The Catcher in the Rye','J.D. Salinger',11.75,7,'Follow Holden Caulfield through New York City as he grapples with adolescent angst and alienation. His distinctive voice captures the confusion and rebellion of teenage years.'),(7,'Moby Dick','Herman Melville',13.25,1,'An epic tale of obsession and revenge on the high seas. Captain Ahab\'s monomaniacal pursuit of the white whale Moby Dick becomes a profound meditation on fate, free will, and the nature of evil.'),(8,'War and Peace','Leo Tolstoy',18,5,'A sweeping saga of Russian society during the Napoleonic era. Follow the interwoven lives of aristocratic families as they navigate love, war, and philosophical questions about life\'s meaning.'),(9,'Oliver Twist','Charles Dickens',8.99,13,'A gripping tale of a young orphan boy navigating the dark streets of Victorian London, encountering criminals and kind strangers alike in his search for identity and belonging.'),(10,'Great Expectations','Charles Dickens',11.5,9,'The semi-autobiographical story of David Copperfield\'s journey from a difficult childhood to becoming a successful writer, filled with unforgettable characters.'),(11,'David Copperfield','Charles Dickens',13,10,'Charles Dickens\' most personal novel, following young David through poverty, love, and ultimately triumph in Victorian England.'),(12,'The Tender Night','F. Scott Fitzgerald',10.25,6,'A haunting story of love and loss on the French Riviera, exploring the lives of expatriates living glamorously but destructively in 1920s Europe.'),(13,'This Side of Paradise','F. Scott Fitzgerald',9.75,13,'Fitzgerald\'s debut novel follows the idealistic Amory Blaine through Princeton and early adulthood, searching for identity and meaning in post-WWI America.'),(14,'The Beautiful and Damned','F. Scott Fitzgerald',12,8,'A portrait of the beautiful and self-destructive Anthony Patch and his wife Gloria, whose lives unravel as they wait to inherit a fortune.'),(15,'Go Set a Watchman','Harper Lee',14.99,10,'Scout Finch, now an adult, returns to Maycomb and confronts painful truths about her father Atticus and the community she thought she knew.'),(16,'Summertime','Harper Lee',7.5,18,'A lyrical novel set in South Africa, exploring themes of memory, identity, and the legacy of apartheid through interconnected stories.'),(17,'The Mockingbird Next Door','Harper Lee',11.25,5,'A journalist\'s intimate portrait of Harper Lee herself, exploring the reclusive author\'s life in her hometown of Monroeville, Alabama.'),(18,'Animal Farm','George Orwell',8.5,21,'A short but powerful allegorical novella in which farm animals overthrow their human farmer, only to find their new leaders just as corrupt.'),(19,'Homage to Catalonia','George Orwell',10.75,8,'Orwell\'s personal account of fighting in the Spanish Civil War, offering a raw and honest look at political disillusionment and the chaos of war.'),(20,'Burmese Days','George Orwell',9.25,13,'Set in colonial Burma, this novel follows a British police officer tormented by his role as an enforcer of imperial rule, torn between duty and conscience.'),(21,'Sense and Sensibility','Jane Austen',8.99,17,'Two sisters navigate love and marriage in Regency England, with the impulsive Marianne contrasting sharply with the reserved and sensible Elinor.'),(22,'Emma','Jane Austen',10.5,12,'A witty and warm portrait of Emma Woodhouse, a young woman convinced of her matchmaking skills but blind to the feelings around — and within — her.'),(23,'Persuasion','Jane Austen',7.99,25,'Austen\'s final completed novel follows Anne Elliot as she reconnects with Captain Wentworth years after being persuaded to break off their engagement.'),(24,'Franny and Zooey','J.D. Salinger',9.5,11,'Two novellas exploring spiritual searching and the quest for authenticity among young New Yorkers in the 1950s, written with Salinger\'s signature wit.'),(25,'Nine Stories','J.D. Salinger',8.75,7,'A celebrated collection of short stories showcasing Salinger\'s mastery of character and voice, including the iconic story A Perfect Day for Bananafish.'),(26,'Raise High the Roof Beam','J.D. Salinger',10,6,'A novella and short story collection centered on the Glass family, exploring themes of spiritual enlightenment and the burden of exceptional intelligence.'),(27,'Billy Budd','Herman Melville',7.25,9,'A short novel written after Melville\'s death, telling the story of a young sailor\'s unjust accusation aboard a warship, a meditation on innocence and injustice.'),(28,'Typee','Herman Melville',8.5,13,'Melville\'s debut novel, a lightly fictionalized account of his own experiences living among the indigenous people of the Marquesas Islands.'),(29,'Pierre','Herman Melville',11,0,'A challenging and ambitious novel following Pierre Glendinning as he abandons his privileged life for a doomed pursuit of idealism and artistic truth.'),(30,'Anna Karenina','Leo Tolstoy',16.5,7,'Tolstoy\'s sweeping portrait of Russian aristocratic society, following Anna\'s tragic love affair against the backdrop of 19th-century social expectations.');
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_records`
--

DROP TABLE IF EXISTS `order_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_records`
--

LOCK TABLES `order_records` WRITE;
/*!40000 ALTER TABLE `order_records` DISABLE KEYS */;
INSERT INTO `order_records` VALUES (1,1,'Michael Joseph Candra','michaelj005@e.ntu.edu.sg','90943976',7,'Moby Dick',13.25),(2,1,'Michael Joseph Candra','michaelj005@e.ntu.edu.sg','90943976',25,'Nine Stories',8.75),(3,1,'Michael Joseph Candra','michaelj005@e.ntu.edu.sg','90943976',9,'Oliver Twist',8.99),(4,1,'曾仁明','michaeljosephcandra@gmail.com','90943976',18,'Animal Farm',8.50),(5,4,'曾仁明','michaeljosephcandra@gmail.com','90943976',1,'A Tale of Two Cities',50.00),(6,1,'曾仁明','michaeljosephcandra@gmail.com','90943976',20,'Burmese Days',9.25),(7,1,'Michael Joseph Candra','michaelj005@e.ntu.edu.sg','90943976',2,'The Great Gatsby',15.99),(8,1,'Sabrina','jace@260505@gmail.com','19517968989',8,'War and Peace',18.00),(9,1,'Sabrina','jace@260505@gmail.com','19517968989',11,'David Copperfield',13.00),(10,3,'Sabrina','jace@260505@gmail.com','19517968989',7,'Moby Dick',39.75),(11,1,'john doe','bb@25560@gmail.com','80002122',19,'Homage to Catalonia',10.75),(12,2,'John','john@email.com','123456',3,'Java Programming',29.90);
/*!40000 ALTER TABLE `order_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'michael','$2a$12$zYyppJsepHL9b994eb81MuN.V8.AlVAU2vlCOW7xshQ54WY064Uka');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-13  0:23:43
