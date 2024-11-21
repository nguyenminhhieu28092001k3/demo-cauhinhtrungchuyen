CREATE TABLE `grid_cells` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gridX` int(11) NOT NULL,
  `gridY` int(11) NOT NULL,
  `xMin` double NOT NULL,
  `yMin` double NOT NULL,
  `xMax` double NOT NULL,
  `yMax` double NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gridX` (`gridX`,`gridY`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=latin1;