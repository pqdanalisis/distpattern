-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.0.29-MariaDB-0ubuntu0.16.04.1 - Ubuntu 16.04
-- SO del servidor:              debian-linux-gnu
-- HeidiSQL Versión:             9.4.0.5157
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Volcando estructura de base de datos para distpattern
CREATE DATABASE IF NOT EXISTS `distpattern` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `distpattern`;

-- Volcando estructura para tabla distpattern.algorithms
CREATE TABLE IF NOT EXISTS `algorithms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `version` varchar(10) NOT NULL,
  `inputformat` varchar(10) NOT NULL,
  `outputformat` varchar(10) NOT NULL,
  `source` mediumtext NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=421 DEFAULT CHARSET=utf8mb4;

-- Volcando estructura para tabla distpattern.datasets
CREATE TABLE IF NOT EXISTS `datasets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `format` varchar(10) NOT NULL,
  `folder` varchar(256) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=879 DEFAULT CHARSET=utf8mb4;

-- Volcando estructura para tabla distpattern.jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `inputset` int(11) NOT NULL,
  `resultset` int(11) NOT NULL,
  `algorithm` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `progress` decimal(5,2) unsigned NOT NULL DEFAULT '0.00',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK__inputsets` (`inputset`),
  KEY `FK__resultsets` (`resultset`),
  KEY `FK__algorithms` (`algorithm`),
  KEY `FK__jobstatus` (`status`),
  CONSTRAINT `FK__algorithms` FOREIGN KEY (`algorithm`) REFERENCES `algorithms` (`id`),
  CONSTRAINT `FK__inputsets` FOREIGN KEY (`inputset`) REFERENCES `datasets` (`id`),
  CONSTRAINT `FK__jobstatus` FOREIGN KEY (`status`) REFERENCES `jobstatus` (`id`),
  CONSTRAINT `FK__resultsets` FOREIGN KEY (`resultset`) REFERENCES `datasets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=356 DEFAULT CHARSET=utf8mb4;

-- Volcando estructura para tabla distpattern.jobstatus
CREATE TABLE IF NOT EXISTS `jobstatus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

-- Volcando datos para la tabla distpattern.jobstatus: ~5 rows (aproximadamente)
/*!40000 ALTER TABLE `jobstatus` DISABLE KEYS */;
INSERT INTO `jobstatus` (`id`, `name`) VALUES
	(1, 'pendding'),
	(2, 'start'),
	(3, 'finish'),
	(4, 'ko'),
	(5, 'stopped');
/*!40000 ALTER TABLE `jobstatus` ENABLE KEYS */;

-- Volcando estructura para tabla distpattern.tasks
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jobid` int(11) NOT NULL,
  `job` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `inputfile` varchar(512) NOT NULL,
  `resultfile` varchar(512) NOT NULL,
  `algorithm` mediumtext NOT NULL,
  `worker` int(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `progress` decimal(5,2) NOT NULL DEFAULT '0.00',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK__jobs` (`jobid`),
  KEY `FK__datafiles` (`inputfile`(191)),
  KEY `FK_tasks_taskstatus` (`status`),
  KEY `FK__workers` (`worker`),
  CONSTRAINT `FK__jobs` FOREIGN KEY (`jobid`) REFERENCES `jobs` (`id`),
  CONSTRAINT `FK__workers` FOREIGN KEY (`worker`) REFERENCES `workers` (`id`),
  CONSTRAINT `FK_tasks_taskstatus` FOREIGN KEY (`status`) REFERENCES `taskstatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=484 DEFAULT CHARSET=utf8mb4;

-- Volcando estructura para tabla distpattern.taskstatus
CREATE TABLE IF NOT EXISTS `taskstatus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

-- Volcando datos para la tabla distpattern.taskstatus: ~5 rows (aproximadamente)
/*!40000 ALTER TABLE `taskstatus` DISABLE KEYS */;
INSERT INTO `taskstatus` (`id`, `name`) VALUES
	(1, 'pending'),
	(2, 'run'),
	(3, 'finish'),
	(4, 'ko'),
	(5, 'stopped');
/*!40000 ALTER TABLE `taskstatus` ENABLE KEYS */;

-- Volcando estructura para tabla distpattern.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `password` varchar(50) NOT NULL,
  `admin` tinyint(4) NOT NULL DEFAULT '0',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login` (`login`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4;

-- Volcando datos para la tabla distpattern.users: ~4 rows (aproximadamente)
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `login`, `name`, `password`, `admin`, `updated`) VALUES
	(1, 'admin', 'Usuario administrador', '660f2fe5d1bdbc668ec7882125a02511', 1, '2017-03-21 18:34:50')
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

-- Volcando estructura para tabla distpattern.workers
CREATE TABLE IF NOT EXISTS `workers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `ip` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `info` mediumtext NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `FK_workers_workerstatus` (`status`),
  CONSTRAINT `FK_workers_workerstatus` FOREIGN KEY (`status`) REFERENCES `workerstatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=224 DEFAULT CHARSET=utf8mb4;


-- Volcando estructura para tabla distpattern.workerstatus
CREATE TABLE IF NOT EXISTS `workerstatus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;

-- Volcando datos para la tabla distpattern.workerstatus: ~3 rows (aproximadamente)
/*!40000 ALTER TABLE `workerstatus` DISABLE KEYS */;
INSERT INTO `workerstatus` (`id`, `name`) VALUES
	(1, 'disconnect'),
	(2, 'ready'),
	(3, 'busy');
/*!40000 ALTER TABLE `workerstatus` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
